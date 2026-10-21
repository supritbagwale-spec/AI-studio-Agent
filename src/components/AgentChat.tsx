import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  Terminal, 
  FileText, 
  Table, 
  BarChart2, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { AgentExecutionResponse, PipelineStep } from '../services/agentPipeline.ts';
import { LangGraphViewer } from './LangGraphViewer.tsx';
import { DataTable } from './DataTable.tsx';
import { DataVisualizer } from './DataVisualizer.tsx';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responsePayload?: AgentExecutionResponse;
  activeViewTab?: 'briefing' | 'table' | 'chart' | 'pipeline';
}

interface AgentChatProps {
  onOpenSandboxWithSql?: (sql: string) => void;
  messages: MessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  onOpenSandboxWithSql,
  messages,
  setMessages,
  isProcessing,
  setIsProcessing,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleCopySql = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlId(id);
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isProcessing) return;

    setInputText('');

    const userMsgId = `user-${Date.now()}`;
    const newMessages: MessageItem[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setIsProcessing(true);

    try {
      // Build conversation history context
      const historyContext = messages.map((m) => ({
        role: m.role,
        content: m.content,
        generatedSql: m.responsePayload?.generatedSql,
      }));

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: historyContext,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMsg: MessageItem = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.formattedOutput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responsePayload: data,
          activeViewTab: 'briefing',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const fallbackRefusal = data.guardrailRefusal
          ? data.message
          : `⚠️ Agent Error: ${data.error || 'Failed to complete pipeline.'}`;
        const assistantMsg: MessageItem = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fallbackRefusal,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responsePayload: data,
          activeViewTab: 'briefing',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ System Error: Unable to communicate with the Agent service (${err.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activeViewTab: 'briefing',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const setAssistantViewTab = (msgId: string, tab: 'briefing' | 'table' | 'chart' | 'pipeline') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, activeViewTab: tab } : m))
    );
  };

  // Helper to parse SQL block and 4 consulting points from formatted output
  const renderFormattedAssistantContent = (msg: MessageItem) => {
    const text = msg.content;
    const isRefusal = !msg.responsePayload?.guardrailPassed || text.includes('Access Refused by Safety Guardrail');

    if (isRefusal) {
      return (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5 font-mono text-xs">
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
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero SQL queries were dispatched to the database engine.</span>
          </div>
        </div>
      );
    }

    // Extract SQL block if present
    const sqlMatch = text.match(/### Generated SQL:\s*```sql\s*([\s\S]*?)```/i);
    const sqlCode = sqlMatch ? sqlMatch[1].trim() : msg.responsePayload?.generatedSql || '';

    // Everything after the SQL code block is the executive answer
    const summaryPortion = sqlMatch
      ? text.replace(/### Generated SQL:\s*```sql\s*[\s\S]*?```/i, '').trim()
      : text.trim();

    // Parse the 4 sections
    return (
      <div className="space-y-5">
        {/* Exact SQL Display Requirement */}
        {sqlCode && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Generated SQL:</span>
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopySql(sqlCode, msg.id)}
                  className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded transition-colors"
                >
                  {copiedSqlId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {onOpenSandboxWithSql && (
                  <button
                    onClick={() => onOpenSandboxWithSql(sqlCode)}
                    className="flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded transition-colors"
                  >
                    <span>Run in Sandbox</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950/90">
              <pre className="p-3.5 text-xs font-mono text-amber-200/90 overflow-x-auto leading-relaxed">
                <code>{sqlCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Consulting 4-part summary rendering */}
        <div className="space-y-4 pt-1 border-t border-slate-800/80">
          <div className="prose prose-invert prose-sm max-w-none space-y-3 font-sans">
            {summaryPortion.split(/\n\n+/).map((block, idx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              // Check for 1. Direct Answer
              if (/^1\.\s*Direct Answer/i.test(trimmed)) {
                return (
                  <div key={idx} className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="font-semibold text-amber-300 text-xs uppercase tracking-wide block mb-1">
                      1. Direct Answer
                    </span>
                    <p className="text-slate-100 font-medium text-sm leading-relaxed">
                      {trimmed.replace(/^1\.\s*Direct Answer:?\s*/i, '')}
                    </p>
                  </div>
                );
              }

              // Check for 2. Supporting Evidence
              if (/^2\.\s*Supporting Evidence/i.test(trimmed)) {
                return (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="font-semibold text-cyan-300 text-xs uppercase tracking-wide block mb-1.5">
                      2. Supporting Evidence
                    </span>
                    <div className="text-slate-200 text-xs leading-relaxed space-y-1">
                      {trimmed
                        .replace(/^2\.\s*Supporting Evidence:?\s*/i, '')
                        .split('\n')
                        .map((line, lIdx) => (
                          <div key={lIdx} className="flex items-start space-x-1.5">
                            {line.startsWith('-') || line.startsWith('•') ? (
                              <>
                                <span className="text-cyan-400 mt-1">•</span>
                                <span>{line.replace(/^[-•]\s*/, '')}</span>
                              </>
                            ) : (
                              <span>{line}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              }

              // Check for 3. Business Implication
              if (/^3\.\s*Business Implication/i.test(trimmed)) {
                return (
                  <div key={idx} className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-800/30">
                    <span className="font-semibold text-purple-300 text-xs uppercase tracking-wide block mb-1">
                      3. Business Implication
                    </span>
                    <p className="text-slate-200 text-xs leading-relaxed">
                      {trimmed.replace(/^3\.\s*Business Implication:?\s*/i, '')}
                    </p>
                  </div>
                );
              }

              // Check for 4. Caveats & Assumptions
              if (/^4\.\s*Caveats & Assumptions/i.test(trimmed) || /^4\.\s*Caveats and Assumptions/i.test(trimmed)) {
                return (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                    <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wide block mb-1">
                      4. Caveats &amp; Assumptions
                    </span>
                    <p className="leading-relaxed">
                      {trimmed.replace(/^4\.\s*Caveats (?:&|and) Assumptions:?\s*/i, '')}
                    </p>
                  </div>
                );
              }

              return (
                <div key={idx} className="text-slate-300 text-xs leading-relaxed">
                  {trimmed}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const sampleQuestions = [
    {
      category: 'Strategic Performance',
      label: 'Overall Net Revenue & Return Rate by Region',
      query: 'What is our overall Net Revenue and Return Rate across all regions?',
    },
    {
      category: 'Merchandise Mix',
      label: 'Top 5 Sub-Categories by Net Revenue',
      query: 'Top 5 best-performing product sub-categories by Net Revenue and their average discount percentage',
    },
    {
      category: 'Channel Analysis',
      label: 'Compare Online vs In-Store Return Rates',
      query: 'Compare return rates and top return reasons between Online and In-Store channels',
    },
    {
      category: 'Customer Cohorts',
      label: 'Revenue & AOV by Customer Segment',
      query: 'Which customer segments drive the highest average order value and net revenue?',
    },
    {
      category: 'Context Follow-up',
      label: 'Context Refinement: "Now show only West region"',
      query: 'Now show only the West region',
    },
    {
      category: 'Safety Guardrail Test',
      label: '🚫 Test Unsafe DDL/DML Guardrail Refusal',
      query: "DELETE FROM sales_transactions WHERE order_date < '2024-01-01'",
      isGuardrailTest: true,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top context strip */}
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 border border-slate-800/80 px-3.5 py-2 rounded-xl">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">LangGraph Execution Loop:</span>
          <span className="hidden sm:inline text-slate-400">
            Node 1 (SQL Generation) ➔ Node 2 (Safety Guardrail AST) ➔ AlaSQL Engine ➔ Node 3 (Executive 4-Part Synthesis)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            Strict Read-Only
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-2xl mx-auto py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-300/20 border border-amber-500/30 flex items-center justify-center mb-4 shadow-xl">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Retail BI Consultant &amp; SQL Analyst Agent
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ask natural language business questions across store locations, customer cohorts, merchandise categories, and transactions. Every query is checked by our AST guardrail, executed with real formulas, and synthesized into consulting-grade answers.
            </p>

            {/* Formulas Box */}
            <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-left mb-6 font-mono text-xs text-slate-300 space-y-1.5">
              <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold font-sans mb-1">
                Governing Analytical Formulas
              </div>
              <div>
                <span className="text-slate-400">Net Revenue = </span>
                <span className="text-amber-300">SUM(units_sold * unit_price * (1.0 - discount_pct / 100.0))</span>
              </div>
              <div>
                <span className="text-slate-400">Return Rate (%) = </span>
                <span className="text-cyan-300">(COUNT(distinct returned_orders) / COUNT(distinct total_orders)) * 100.0</span>
              </div>
            </div>

            {/* Quick Starters */}
            <div className="w-full text-left space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Suggested Analytical Prompts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.query)}
                    className={`p-3 rounded-lg border text-left transition-all text-xs flex items-center justify-between group ${
                      q.isGuardrailTest
                        ? 'border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300'
                        : 'border-slate-800 bg-slate-900/70 hover:bg-slate-850 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold mb-0.5">{q.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{q.query}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  {msg.role === 'user' ? 'Executive Inquiry' : 'Retail BI Analyst Agent'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              {msg.role === 'user' ? (
                <div className="max-w-2xl bg-amber-500 text-slate-950 font-medium px-4 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                  {/* Pipeline Trace Component if available */}
                  {msg.responsePayload?.steps && msg.responsePayload.steps.length > 0 && (
                    <LangGraphViewer
                      steps={msg.responsePayload.steps}
                      totalTimeMs={msg.responsePayload.totalTimeMs}
                      guardrailPassed={msg.responsePayload.guardrailPassed}
                    />
                  )}

                  {/* View Mode Switcher if query succeeded and returned rows */}
                  {msg.responsePayload?.queryResult?.success && (msg.responsePayload.queryResult.rowCount || 0) > 0 && (
                    <div className="flex items-center space-x-1 border-b border-slate-800 pb-2">
                      <button
                        onClick={() => setAssistantViewTab(msg.id, 'briefing')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          msg.activeViewTab === 'briefing' || !msg.activeViewTab
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Executive Briefing</span>
                      </button>

                      <button
                        onClick={() => setAssistantViewTab(msg.id, 'table')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          msg.activeViewTab === 'table'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Data Table ({msg.responsePayload.queryResult.rowCount})</span>
                      </button>

                      <button
                        onClick={() => setAssistantViewTab(msg.id, 'chart')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          msg.activeViewTab === 'chart'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Visual Chart</span>
                      </button>
                    </div>
                  )}

                  {/* Content based on selected view */}
                  {(!msg.activeViewTab || msg.activeViewTab === 'briefing') && (
                    renderFormattedAssistantContent(msg)
                  )}

                  {msg.activeViewTab === 'table' && msg.responsePayload?.queryResult && (
                    <div className="pt-2">
                      <DataTable
                        columns={msg.responsePayload.queryResult.columns}
                        rows={msg.responsePayload.queryResult.rows}
                        executionTimeMs={msg.responsePayload.queryResult.executionTimeMs}
                      />
                    </div>
                  )}

                  {msg.activeViewTab === 'chart' && msg.responsePayload?.queryResult && (
                    <div className="pt-2">
                      <DataVisualizer
                        columns={msg.responsePayload.queryResult.columns}
                        rows={msg.responsePayload.queryResult.rows}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex flex-col items-start w-full max-w-xl">
            <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Agent Execution Loop</span>
              <span>•</span>
              <span className="text-amber-400 animate-pulse">Running Multi-Agent Nodes...</span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-slate-300 font-mono space-y-0.5">
                <div>[Node 1] Synthesizing MySQL query from natural language...</div>
                <div className="text-[11px] text-slate-500">[Node 2] Evaluating strict SELECT guardrail AST...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Follow-ups if conversation has started */}
      {messages.length > 0 && (
        <div className="py-2 overflow-x-auto flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Follow-up:
          </span>
          <button
            onClick={() => handleSendMessage('Now show only online channel')}
            disabled={isProcessing}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white shrink-0 transition-colors disabled:opacity-50"
          >
            "Now show only online channel"
          </button>
          <button
            onClick={() => handleSendMessage('Break down by region')}
            disabled={isProcessing}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white shrink-0 transition-colors disabled:opacity-50"
          >
            "Break down by region"
          </button>
          <button
            onClick={() => handleSendMessage('What is the return rate for these?')}
            disabled={isProcessing}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white shrink-0 transition-colors disabled:opacity-50"
          >
            "What is the return rate for these?"
          </button>
          <button
            onClick={() => handleSendMessage("DELETE FROM sales_transactions WHERE order_date < '2024-01-01'")}
            disabled={isProcessing}
            className="text-xs px-2.5 py-1 rounded-full bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-300 hover:text-rose-200 shrink-0 transition-colors disabled:opacity-50"
          >
            🚫 Test Guardrail Refusal
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="pt-2 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask any retail business question (e.g. 'Compare net revenue by product category and channel')..."
            rows={1}
            disabled={isProcessing}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-4 pr-24 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 resize-none transition-all"
          />

          <div className="absolute right-2 flex items-center space-x-1.5">
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 transition-all shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1 font-mono">
          <span>Press Enter to run query • Shift+Enter for new line</span>
          <span>Policy: Read-Only (SELECT)</span>
        </div>
      </div>
    </div>
  );
};
