import React, { useState, useEffect, useCallback } from 'react';
import { 
  Network, Tags, Wrench, BookOpen, CheckCircle2, 
  BellRing, Bot, Clock, AlertTriangle, ArrowRight, 
  MessageSquare, Radio, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { AgentProfile, InterAgentMessage } from '../../types';
import { fetchAgents, fetchInterAgentMessages, wsBus } from '../../services/api';

const ICONS: Record<string, React.ElementType> = {
  coordinator_agent: Network,
  classification_agent: Tags,
  troubleshooting_agent: Wrench,
  knowledge_base_agent: BookOpen,
  resolution_agent: CheckCircle2,
  notification_agent: BellRing
};

export const AgentsMonitoringView: React.FC = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [messages, setMessages] = useState<InterAgentMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [a, m] = await Promise.all([
        fetchAgents(),
        fetchInterAgentMessages()
      ]);
      setAgents(a);
      setMessages(m);
    } catch (e) {
      console.error('Error loading agent telemetry:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to real-time events to update agent cards and messages
    const unsub = wsBus.subscribe((event, payload) => {
      if (['agent_started', 'agent_completed', 'workflow_started', 'workflow_completed'].includes(event)) {
        loadData();
      }
    });

    return () => unsub();
  }, [loadData]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI Agent Workforce Telemetry
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time health, latency, directive tracking, and inter-agent communication bus.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <span>Active Agents: <strong className="text-slate-900 font-bold">6/6</strong></span>
          <span>·</span>
          <span>Model: <strong className="text-blue-600">Gemini 3.8 Flash</strong></span>
        </div>
      </div>

      {/* 6 Specialized Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map(agent => {
          const Icon = ICONS[agent.id] || Bot;
          const isRunning = agent.currentStatus === 'running';
          const isWaiting = agent.currentStatus === 'waiting_approval';

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`bg-white rounded-xl border p-5 shadow-2xs transition-all cursor-pointer hover:shadow-md ${
                isRunning ? 'border-blue-500 ring-2 ring-blue-100' :
                isWaiting ? 'border-amber-400 ring-2 ring-amber-50' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Agent Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    isRunning ? 'bg-blue-600 animate-pulse' :
                    isWaiting ? 'bg-amber-600' :
                    'bg-navy-900'
                  }`} style={{ backgroundColor: isRunning ? undefined : isWaiting ? undefined : '#0f172a' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {agent.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {agent.role}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isRunning ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  isWaiting ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {agent.currentStatus}
                </span>
              </div>

              {/* Current Task */}
              <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Current Task Directive
                </span>
                <p className="text-xs text-slate-800 font-medium line-clamp-2">
                  {agent.currentTask}
                </p>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Completed Tasks</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {agent.tasksCompleted}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Failed Tasks</span>
                  <span className="font-mono tabular-nums font-semibold text-rose-600">
                    {agent.failedTasks}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Avg Processing</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {(agent.averageExecutionTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Last Active</span>
                  <span className="text-slate-600 font-medium">
                    {agent.lastActive}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-blue-600 font-semibold flex items-center justify-end gap-1">
                Inspect System Prompt →
              </div>
            </div>
          );
        })}
      </div>

      {/* Inter-Agent Communication Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Inter-Agent Communication Bus
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Structured JSON Handoffs ({messages.length} messages)
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 p-2 rounded-lg transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                  {msg.ticketId.replace('TKT-', '#')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900">{msg.fromAgent}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-700">{msg.toAgent}</span>
                  </div>
                  <p className="text-slate-700 font-medium">
                    {msg.message}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Payload: {msg.payloadSummary}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent System Prompt Inspection Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {selectedAgent.name} System Instructions
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedAgent.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Agent Description & Boundary
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedAgent.description}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Active System Prompt (Passed to Gemini 3.8 Flash)
              </span>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {selectedAgent.systemInstruction}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
