import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Network, Tags, Wrench, BookOpen, CheckCircle2, 
  BellRing, UserCheck, ShieldAlert, Clock, AlertTriangle, 
  Check, ArrowRight, Loader2
} from 'lucide-react';
import { AgentStatus } from '../../types';

export interface AgentNodeData {
  agentId: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string;
  executionDurationMs?: number;
  decisionSummary?: string;
  isTerminal?: boolean;
  isInitial?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  coordinator_agent: Network,
  classification_agent: Tags,
  troubleshooting_agent: Wrench,
  knowledge_base_agent: BookOpen,
  resolution_agent: CheckCircle2,
  notification_agent: BellRing,
  initial_request: UserCheck,
  terminal_node: CheckCircle2
};

export const AgentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as AgentNodeData;
  const IconComponent = ICONS[nodeData.agentId] || Network;

  const getStatusStyles = (status: AgentStatus) => {
    switch (status) {
      case 'running':
        return {
          container: 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-400/30',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-600 text-white',
          label: 'Running'
        };
      case 'completed':
        return {
          container: 'border-emerald-500 shadow-sm',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-600 text-white',
          label: 'Completed'
        };
      case 'waiting_approval':
        return {
          container: 'border-amber-500 shadow-lg shadow-amber-100 ring-2 ring-amber-400/30',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-600 text-white',
          label: 'Approval Required'
        };
      case 'failed':
        return {
          container: 'border-rose-500 shadow-sm',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-600 text-white',
          label: 'Failed'
        };
      case 'escalated':
        return {
          container: 'border-purple-500 shadow-sm',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-600 text-white',
          label: 'Escalated'
        };
      case 'idle':
      default:
        return {
          container: 'border-slate-200 hover:border-slate-300 shadow-sm',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-600',
          label: 'Pending'
        };
    }
  };

  const style = getStatusStyles(nodeData.status);

  return (
    <div 
      className={`w-72 bg-white rounded-xl border-2 transition-all duration-200 p-4 select-none ${style.container} ${selected ? 'ring-2 ring-navy-600 ring-offset-2' : ''}`}
    >
      {!nodeData.isInitial && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" 
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${style.iconBg}`}>
            {nodeData.status === 'running' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <IconComponent className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">
              {nodeData.name}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              {nodeData.role}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Current Task Description */}
      <div className="bg-slate-50 rounded-lg p-2.5 mb-2.5 border border-slate-100">
        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
          {nodeData.currentTask || 'Awaiting pipeline dispatch'}
        </p>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono tabular-nums">
            {nodeData.executionDurationMs 
              ? `${(nodeData.executionDurationMs / 1000).toFixed(2)}s` 
              : '--'}
          </span>
        </div>

        {nodeData.decisionSummary && (
          <span className="text-[11px] text-blue-600 font-medium truncate max-w-[140px]">
            Inspect Output →
          </span>
        )}
      </div>

      {!nodeData.isTerminal && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" 
        />
      )}
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
