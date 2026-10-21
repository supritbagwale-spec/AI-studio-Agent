import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Clock,
  Code
} from 'lucide-react';
import { DataTable } from './DataTable.tsx';
import { DataVisualizer } from './DataVisualizer.tsx';

interface SqlSandboxProps {
  initialSql?: string;
}

export const SqlSandbox: React.FC<SqlSandboxProps> = ({ initialSql }) => {
  const [sql, setSql] = useState(
    initialSql ||
      `SELECT \n  p.category,\n  COUNT(s.order_id) AS total_orders,\n  SUM(s.units_sold) AS units_sold,\n  ROUND(AVG(s.discount_pct), 2) AS avg_discount_pct,\n  ROUND(SUM(s.units_sold * s.unit_price * (1.0 - s.discount_pct / 100.0)), 2) AS net_revenue\nFROM sales_transactions s\nJOIN products p ON s.product_id = p.product_id\nGROUP BY p.category\nORDER BY net_revenue DESC;`
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'table' | 'chart'>('table');

  const executeSql = async (queryToRun?: string) => {
    const q = (queryToRun || sql).trim();
    if (!q) return;

    setIsExecuting(true);
    setGuardrailError(null);
    setResult(null);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q }),
      });

      const data = await res.json();

      if (res.status === 403 || data.guardrailRefusal) {
        setGuardrailError(
          data.message ||
            '🚫 Access Refused by Safety Guardrail\nReason: Unsafe SQL operational keyword detected.\nPolicy: Only read-only data analysis (SELECT) queries are permitted.'
        );
      } else if (!data.success) {
        setResult({
          error: data.error || 'SQL Execution error',
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: data.executionTimeMs || 0,
        });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setGuardrailError(`Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const templates = [
    {
      title: 'Net Revenue by Product Category',
      sql: `SELECT \n  p.category,\n  COUNT(s.order_id) AS total_orders,\n  ROUND(AVG(s.discount_pct), 2) AS avg_discount,\n  ROUND(SUM(s.units_sold * s.unit_price * (1.0 - s.discount_pct / 100.0)), 2) AS net_revenue\nFROM sales_transactions s\nJOIN products p ON s.product_id = p.product_id\nGROUP BY p.category\nORDER BY net_revenue DESC;`,
    },
    {
      title: 'Omnichannel Return Rate (%) & Reasons',
      sql: `SELECT \n  s.sales_channel,\n  COUNT(DISTINCT s.order_id) AS total_orders,\n  COUNT(DISTINCT r.order_id) AS returned_orders,\n  ROUND((COUNT(DISTINCT r.order_id) * 100.0 / COUNT(DISTINCT s.order_id)), 2) AS return_rate_pct\nFROM sales_transactions s\nLEFT JOIN returns r ON s.order_id = r.order_id\nGROUP BY s.sales_channel\nORDER BY return_rate_pct DESC;`,
    },
    {
      title: 'Customer Segments Order Value & Margin',
      sql: `SELECT \n  c.customer_segment,\n  COUNT(DISTINCT c.customer_id) AS customers,\n  COUNT(s.order_id) AS total_orders,\n  ROUND(SUM(s.units_sold * s.unit_price * (1.0 - s.discount_pct / 100.0)), 2) AS net_revenue,\n  ROUND(SUM(s.units_sold * s.unit_price * (1.0 - s.discount_pct / 100.0)) / COUNT(s.order_id), 2) AS avg_order_value\nFROM sales_transactions s\nJOIN customers c ON s.customer_id = c.customer_id\nGROUP BY c.customer_segment\nORDER BY net_revenue DESC;`,
    },
    {
      title: '🚨 Test Unsafe Query (Guardrail Trigger)',
      sql: `DELETE FROM sales_transactions WHERE units_sold > 2;`,
      isUnsafe: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Interactive Retail SQL Sandbox</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute ad-hoc analytical queries over the in-memory retail database with real-time AST guardrail verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Guardrail Active (Read-Only)</span>
          </div>
        </div>
      </div>

      {/* SQL Editor Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Templates quick bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] shrink-0">
            Query Presets:
          </span>
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => {
                setSql(tpl.sql);
                setGuardrailError(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono shrink-0 transition-colors border ${
                tpl.isUnsafe
                  ? 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-800/40 text-rose-300'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tpl.title}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/30">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={7}
            className="w-full bg-transparent p-4 font-mono text-xs text-amber-200/90 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
            placeholder="Type your SELECT query here..."
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSql('')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => executeSql()}
            disabled={isExecuting || !sql.trim()}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all"
          >
            {isExecuting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Query</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guardrail Refusal Box */}
      {guardrailError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1 font-mono text-xs">
              <div className="font-bold text-rose-300 text-sm">
                🚫 Access Refused by Safety Guardrail
              </div>
              <div className="text-rose-200">
                <span className="text-rose-400 font-semibold">Reason:</span> Unsafe SQL operational keyword detected.
              </div>
              <div className="text-rose-300">
                <span className="text-rose-400 font-semibold">Policy:</span> Only read-only data analysis (SELECT) queries are permitted.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Execution Error */}
      {result?.error && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold mb-1">SQL Syntax or Execution Error</div>
            <div className="font-mono text-amber-200">{result.error}</div>
          </div>
        </div>
      )}

      {/* Query Results */}
      {result?.success && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-slate-200">Execution Results</h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {result.rowCount} rows in {result.executionTimeMs}ms
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setViewTab('table')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  viewTab === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewTab('chart')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  viewTab === 'chart' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chart
              </button>
            </div>
          </div>

          {viewTab === 'table' ? (
            <DataTable
              columns={result.columns}
              rows={result.rows}
              executionTimeMs={result.executionTimeMs}
            />
          ) : (
            <DataVisualizer columns={result.columns} rows={result.rows} />
          )}
        </div>
      )}
    </div>
  );
};
