import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentPipelineService } from './src/services/agentPipeline.ts';
import { RetailSqlEngine } from './src/services/sqlEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  const agentPipeline = AgentPipelineService.getInstance();
  const sqlEngine = RetailSqlEngine.getInstance();

  // Endpoint: Health & Metadata Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Endpoint: Retail Schema & Sample Data for Inspector
  app.get('/api/db/schema', (req, res) => {
    try {
      const metadata = sqlEngine.getSchemaMetadata();
      res.json({ success: true, tables: metadata });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint: Sandbox SQL Query Execution (Strictly checked against read-only guardrails)
  app.post('/api/db/query', (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ success: false, error: 'SQL query string is required' });
      }

      const guardrail = sqlEngine.validateGuardrails(sql);
      if (!guardrail.isSafe) {
        return res.status(403).json({
          success: false,
          guardrailRefusal: true,
          message: guardrail.refusalMessage || '🚫 Access Refused by Safety Guardrail\nReason: Unsafe SQL operational keyword detected.\nPolicy: Only read-only data analysis (SELECT) queries are permitted.',
          reason: guardrail.reason,
        });
      }

      const result = sqlEngine.executeQuery(sql);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint: Multi-Agent LangGraph Chat Pipeline
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'User prompt is required' });
      }

      const result = await agentPipeline.executePipeline(prompt, history || []);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('Agent chat pipeline error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Agent pipeline failed during execution',
      });
    }
  });

  // Dev vs Production Vite setup
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Retail SQL Analyst Agent server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
