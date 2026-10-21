import React, { useState } from 'react';
import { 
  Code2, 
  ShieldCheck, 
  ShieldAlert, 
  Database, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown,
  Info
} from 'lucide-react';
import { PipelineStep } from '../services/agentPipeline.ts';

interface LangGraphViewerProps {
  steps: PipelineStep[];
  totalTimeMs?: number;
  guardrailPassed?: boolean;
}

export const LangGraphViewer: React.FC<LangGraphViewerProps> = ({
  steps,
  totalTimeMs,
  guardrailPassed = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const getNodeIcon = (nodeId: string, status: string) => {
    switch (nodeId) {
      case 'sql_generation':
        return <Code2 className="w-4 h-4 text-cyan-400" />;
      case 'guardrail_validation':
        return status === 'refused' ? (
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        );
      case 'query_execution':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'executive_summarization':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Code2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              LangGraph Multi-Agent Pipeline
            </span>
          </div>

          <div className="flex items-center space-x-1 pl-2 border-l border-slate-700/60">
            {steps.map((step, idx) => (
              <React.Fragment key={step.nodeId + idx}>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    step.status === 'refused'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : step.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                  }`}
                >
                  {step.nodeId === 'sql_generation' && '1. SQL Gen'}
                  {step.nodeId === 'guardrail_validation' && '2. Guardrail'}
                  {step.nodeId === 'query_execution' && 'Retail DB'}
                  {step.nodeId === 'executive_summarization' && '3. Summary'}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          {totalTimeMs !== undefined && (
            <div className="flex items-center space-x-1 text-slate-400 font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{totalTimeMs}ms</span>
            </div>
          )}
          <span className="text-[11px] text-slate-500">
            {isExpanded ? 'Hide Trace' : 'Inspect Pipeline'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Step Trace */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {steps.map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <div
                  key={step.nodeId + idx}
                  onClick={() => setActiveStepIndex(isSelected ? null : idx)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    step.status === 'refused'
                      ? 'border-rose-800/60 bg-rose-950/20 hover:bg-rose-950/30'
                      : step.status === 'completed'
                      ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
                      : 'border-amber-800/40 bg-amber-950/20'
                  } ${isSelected ? 'ring-1 ring-amber-400/80' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-slate-800/80">
                        {getNodeIcon(step.nodeId, step.status)}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {step.nodeName}
                      </span>
                    </div>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                    {step.outputSummary || step.inputSummary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Node #{idx + 1}</span>
                    <span className="text-slate-400">{step.executionTimeMs}ms</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Step Drawer */}
          {activeStepIndex !== null && steps[activeStepIndex] && (
            <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  {steps[activeStepIndex].nodeName} Details
                </span>
                <span className="text-slate-400 font-mono">
                  Execution Time: {steps[activeStepIndex].executionTimeMs}ms
                </span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-500 font-semibold mr-1.5">Input:</span>
                  <span>{steps[activeStepIndex].inputSummary}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold mr-1.5">Output:</span>
                  <span>{steps[activeStepIndex].outputSummary}</span>
                </div>
                {steps[activeStepIndex].details && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 font-semibold block mb-1">State Payload:</span>
                    <pre className="p-2 bg-slate-950 rounded text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                      {JSON.stringify(steps[activeStepIndex].details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
