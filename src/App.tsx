/**
 * RetailIQ - Autonomous Retail SQL Data Analyst Agent & BI Consultant
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { AgentChat, MessageItem } from './components/AgentChat.tsx';
import { SchemaInspector } from './components/SchemaInspector.tsx';
import { SqlSandbox } from './components/SqlSandbox.tsx';
import { ExecutiveDashboard } from './components/ExecutiveDashboard.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'schema' | 'sandbox' | 'dashboard'>('chat');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sandboxSql, setSandboxSql] = useState<string>('');
  const [totalRecords, setTotalRecords] = useState<number>(382);

  useEffect(() => {
    // Fetch schema record counts
    fetch('/api/db/schema')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          const sum = data.tables.reduce((acc: number, t: any) => acc + (t.rowCount || 0), 0);
          setTotalRecords(sum);
        }
      })
      .catch(() => {});
  }, []);

  const handleResetChat = () => {
    setMessages([]);
  };

  const handleOpenSandboxWithSql = (sql: string) => {
    setSandboxSql(sql);
    setActiveTab('sandbox');
  };

  const handleAskAgent = (query: string) => {
    setActiveTab('chat');
    // We add user message and trigger execution
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: query,
        history: messages.map((m) => ({
          role: m.role,
          content: m.content,
          generatedSql: m.responsePayload?.generatedSql,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
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
          const fallback = data.guardrailRefusal
            ? data.message
            : `⚠️ Agent Error: ${data.error || 'Failed to complete pipeline.'}`;
          const assistantMsg: MessageItem = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fallback,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            responsePayload: data,
            activeViewTab: 'briefing',
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      })
      .catch((err) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ System Error: Unable to communicate with the Agent service (${err.message})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            activeViewTab: 'briefing',
          },
        ]);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetChat={handleResetChat}
        isProcessing={isProcessing}
        totalRecordsCount={totalRecords}
      />

      {/* Main Tab Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'chat' && (
          <AgentChat
            onOpenSandboxWithSql={handleOpenSandboxWithSql}
            messages={messages}
            setMessages={setMessages}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}

        {activeTab === 'schema' && (
          <SchemaInspector onAskAboutTable={handleAskAgent} />
        )}

        {activeTab === 'sandbox' && (
          <SqlSandbox initialSql={sandboxSql} />
        )}

        {activeTab === 'dashboard' && (
          <ExecutiveDashboard onAskAgent={handleAskAgent} />
        )}
      </main>
    </div>
  );
}
