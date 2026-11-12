import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ReactFlow, Background, Controls, MiniMap, 
  Node, Edge, MarkerType, applyNodeChanges, applyEdgeChanges,
  NodeChange, EdgeChange
} from '@xyflow/react';
import { 
  Play, RefreshCw, CheckCircle2, AlertTriangle, 
  X, Clock, Cpu, FileText, ArrowRight, ShieldCheck, 
  Terminal, Sparkles, ChevronRight, User, Check
} from 'lucide-react';
import { AgentNode, AgentNodeData } from './AgentNode';
import { 
  Ticket, WorkflowExecution, AgentId, AgentStepExecution 
} from '../../types';
import { 
  fetchWorkflow, fetchTickets, rerunWorkflow, 
  approveTicket, rejectTicket, wsBus 
} from '../../services/api';

const nodeTypes = {
  agentNode: AgentNode,
};

interface WorkflowViewProps {
  selectedTicketId?: string;
  onSelectTicket?: (ticketId: string) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({ 
  selectedTicketId = 'TKT-1002',
  onSelectTicket
}) => {
  const [currentTicketId, setCurrentTicketId] = useState<string>(selectedTicketId);
  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | 'initial_request' | 'terminal_node' | null>('resolution_agent');
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Sync external prop change
  useEffect(() => {
    if (selectedTicketId && selectedTicketId !== currentTicketId) {
      setCurrentTicketId(selectedTicketId);
    }
  }, [selectedTicketId]);

  // Load ticket options
  const loadTickets = useCallback(async () => {
    try {
      const tickets = await fetchTickets();
      setTicketList(tickets);
      const match = tickets.find(t => t.id === currentTicketId);
      if (match) setCurrentTicket(match);
    } catch (e) {
      console.error('Failed to load tickets list:', e);
    }
  }, [currentTicketId]);

  // Load specific workflow data
  const loadWorkflowData = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      const wf = await fetchWorkflow(ticketId);
      setWorkflow(wf);
    } catch (e) {
      console.error(`Workflow for ${ticketId} not found, will display fresh state:`, e);
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (currentTicketId) {
      loadWorkflowData(currentTicketId);
      const match = ticketList.find(t => t.id === currentTicketId);
      if (match) setCurrentTicket(match);
    }
  }, [currentTicketId, loadWorkflowData, ticketList]);

  // Listen to WebSocket events in real time
  useEffect(() => {
    const unsubscribe = wsBus.subscribe((event, payload) => {
      if (payload?.ticketId === currentTicketId) {
        if (event === 'workflow_started') {
          setWorkflow(payload.workflow);
          setExecuting(true);
        } else if (event === 'agent_started' || event === 'agent_completed') {
          setWorkflow(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              steps: {
                ...prev.steps,
                [payload.agentId]: payload.step
              },
              currentAgentId: event === 'agent_started' ? payload.agentId : prev.currentAgentId
            };
          });
        } else if (event === 'workflow_waiting_approval' || event === 'workflow_completed') {
          setWorkflow(payload.workflow);
          setExecuting(false);
          loadTickets();
        }
      }
    });

    return () => unsubscribe();
  }, [currentTicketId, loadTickets]);

  // Trigger real backend execution
  const handleRunPipeline = async () => {
    if (!currentTicketId || executing) return;
    try {
      setExecuting(true);
      const wf = await rerunWorkflow(currentTicketId);
      setWorkflow(wf);
      await loadTickets();
    } catch (e) {
      console.error('Failed to rerun pipeline:', e);
    } finally {
      setExecuting(false);
    }
  };

  // Handle human approval
  const handleApprove = async () => {
    if (!currentTicketId) return;
    try {
      setActionLoading(true);
      const res = await approveTicket(currentTicketId, 'IT Operations Lead');
      setWorkflow(res.workflow);
      setCurrentTicket(res.ticket);
      await loadTickets();
    } catch (e) {
      console.error('Approval failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle human rejection
  const handleReject = async () => {
    if (!currentTicketId) return;
    try {
      setActionLoading(true);
      const res = await rejectTicket(currentTicketId, 'Administrative security constraint.');
      setCurrentTicket(res);
      await loadWorkflowData(currentTicketId);
      await loadTickets();
    } catch (e) {
      console.error('Rejection failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Construct React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    const steps = workflow?.steps || {} as Record<AgentId, AgentStepExecution>;

    const getStatus = (id: AgentId) => steps[id]?.status || 'idle';
    const getTask = (id: AgentId) => steps[id]?.currentTask || 'Awaiting dispatch';
    const getDuration = (id: AgentId) => steps[id]?.executionDurationMs;
    const getSummary = (id: AgentId) => steps[id]?.decisionSummary;

    // Node coordinate calculation: Horizontal pipeline with comfortable breathing room
    // Left-to-right flow with 320px column spacing
    return [
      {
        id: 'initial_request',
        type: 'agentNode',
        position: { x: 50, y: 140 },
        data: {
          agentId: 'initial_request',
          name: 'Employee Request',
          role: currentTicket ? `${currentTicket.employeeName} (${currentTicket.department})` : 'Employee Intake',
          status: 'completed',
          currentTask: currentTicket ? currentTicket.title : 'Ticket payload submitted',
          executionDurationMs: 0,
          decisionSummary: currentTicket ? `Priority: ${currentTicket.priority} · ${currentTicket.category}` : undefined,
          isInitial: true
        }
      },
      {
        id: 'coordinator_agent',
        type: 'agentNode',
        position: { x: 380, y: 140 },
        data: {
          agentId: 'coordinator_agent',
          name: 'Coordinator Agent',
          role: 'Workflow Manager',
          status: getStatus('coordinator_agent'),
          currentTask: getTask('coordinator_agent'),
          executionDurationMs: getDuration('coordinator_agent'),
          decisionSummary: getSummary('coordinator_agent')
        }
      },
      {
        id: 'classification_agent',
        type: 'agentNode',
        position: { x: 710, y: 140 },
        data: {
          agentId: 'classification_agent',
          name: 'Classification Agent',
          role: 'Taxonomy Specialist',
          status: getStatus('classification_agent'),
          currentTask: getTask('classification_agent'),
          executionDurationMs: getDuration('classification_agent'),
          decisionSummary: getSummary('classification_agent')
        }
      },
      {
        id: 'troubleshooting_agent',
        type: 'agentNode',
        position: { x: 1040, y: 140 },
        data: {
          agentId: 'troubleshooting_agent',
          name: 'Troubleshooting Agent',
          role: 'Root Cause Specialist',
          status: getStatus('troubleshooting_agent'),
          currentTask: getTask('troubleshooting_agent'),
          executionDurationMs: getDuration('troubleshooting_agent'),
          decisionSummary: getSummary('troubleshooting_agent')
        }
      },
      {
        id: 'knowledge_base_agent',
        type: 'agentNode',
        position: { x: 1370, y: 140 },
        data: {
          agentId: 'knowledge_base_agent',
          name: 'Knowledge Base Agent',
          role: 'IT SOP Specialist',
          status: getStatus('knowledge_base_agent'),
          currentTask: getTask('knowledge_base_agent'),
          executionDurationMs: getDuration('knowledge_base_agent'),
          decisionSummary: getSummary('knowledge_base_agent')
        }
      },
      {
        id: 'resolution_agent',
        type: 'agentNode',
        position: { x: 1700, y: 140 },
        data: {
          agentId: 'resolution_agent',
          name: 'Resolution Agent',
          role: 'Remediation Specialist',
          status: getStatus('resolution_agent'),
          currentTask: getTask('resolution_agent'),
          executionDurationMs: getDuration('resolution_agent'),
          decisionSummary: getSummary('resolution_agent')
        }
      },
      {
        id: 'notification_agent',
        type: 'agentNode',
        position: { x: 2030, y: 140 },
        data: {
          agentId: 'notification_agent',
          name: 'Notification Agent',
          role: 'Employee Communication',
          status: getStatus('notification_agent'),
          currentTask: getTask('notification_agent'),
          executionDurationMs: getDuration('notification_agent'),
          decisionSummary: getSummary('notification_agent')
        }
      },
      {
        id: 'terminal_node',
        type: 'agentNode',
        position: { x: 2360, y: 140 },
        data: {
          agentId: 'terminal_node',
          name: workflow?.status === 'waiting_approval' 
            ? 'Pending Approval' 
            : workflow?.status === 'escalated'
            ? 'Human Escalation'
            : workflow?.status === 'completed'
            ? 'Ticket Resolved'
            : 'Ticket Closed',
          role: 'Pipeline Outcome',
          status: workflow?.status === 'waiting_approval' 
            ? 'waiting_approval' 
            : workflow?.status === 'escalated'
            ? 'escalated'
            : workflow?.status === 'completed'
            ? 'completed'
            : 'idle',
          currentTask: workflow?.status === 'waiting_approval'
            ? 'Awaiting human authorization to complete ticket'
            : workflow?.status === 'completed'
            ? 'Remediation finalized & employee notified'
            : 'Pending workflow completion',
          executionDurationMs: 0,
          isTerminal: true
        }
      }
    ];
  }, [workflow, currentTicket]);

  // Construct Edges with dynamic animated flow
  const edges: Edge[] = useMemo(() => {
    const steps = workflow?.steps || {} as Record<AgentId, AgentStepExecution>;

    const isStepActive = (id: AgentId) => steps[id]?.status === 'running' || steps[id]?.status === 'completed';
    const isStepCompleted = (id: AgentId) => steps[id]?.status === 'completed';

    const pipelinePairs: [string, string, AgentId | null][] = [
      ['initial_request', 'coordinator_agent', null],
      ['coordinator_agent', 'classification_agent', 'coordinator_agent'],
      ['classification_agent', 'troubleshooting_agent', 'classification_agent'],
      ['troubleshooting_agent', 'knowledge_base_agent', 'troubleshooting_agent'],
      ['knowledge_base_agent', 'resolution_agent', 'knowledge_base_agent'],
      ['resolution_agent', 'notification_agent', 'resolution_agent'],
      ['notification_agent', 'terminal_node', 'notification_agent']
    ];

    return pipelinePairs.map(([source, target, requiredAgent]) => {
      const active = requiredAgent ? isStepActive(requiredAgent) : true;
      const completed = requiredAgent ? isStepCompleted(requiredAgent) : true;

      return {
        id: `e-${source}-${target}`,
        source,
        target,
        animated: active && !completed,
        style: {
          stroke: completed ? '#10b981' : active ? '#3b82f6' : '#cbd5e1',
          strokeWidth: completed || active ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completed ? '#10b981' : active ? '#3b82f6' : '#cbd5e1',
          width: 14,
          height: 14
        }
      };
    });
  }, [workflow]);

  // Handle node click
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedAgentId(node.id as any);
  };

  // Inspect selected agent details
  const selectedStep = useMemo(() => {
    if (!selectedAgentId || !workflow || selectedAgentId === 'initial_request' || selectedAgentId === 'terminal_node') {
      return null;
    }
    return workflow.steps[selectedAgentId as AgentId] || null;
  }, [selectedAgentId, workflow]);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Autonomous Agent Orchestration Pipeline
              <span className="text-xs font-normal bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Gemini 3.8 Flash Powered
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Six specialized AI agents autonomously triaging, diagnosing, and resolving enterprise workplace issues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Ticket Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Active Ticket:</span>
            <select
              value={currentTicketId}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentTicketId(val);
                if (onSelectTicket) onSelectTicket(val);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {ticketList.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.title.slice(0, 38)}... ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Workflow Execution */}
          <button
            onClick={handleRunPipeline}
            disabled={executing}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg text-white transition-all shadow-xs ${
              executing ? 'bg-blue-400 cursor-not-allowed' : 'bg-navy-900 hover:bg-navy-800 active:scale-98'
            }`}
            style={{ backgroundColor: executing ? undefined : '#0f172a' }}
          >
            {executing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Agents Executing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Live Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Approval Banner if waiting approval */}
      {workflow?.status === 'waiting_approval' && currentTicket?.requiresApproval && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Human Sign-Off Required for Sensitive Remediation Action
              </h4>
              <p className="text-xs text-amber-800">
                {currentTicket.approvalDetails?.action} — <span className="font-semibold text-amber-950">{currentTicket.approvalDetails?.reason}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Reject Action
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              {actionLoading ? 'Approving...' : 'Approve & Resume Execution'}
            </button>
          </div>
        </div>
      )}

      {/* Main Graph Canvas & Side Panel Container */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* React Flow Graph */}
        <div className="flex-1 h-full bg-slate-50 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background gap={18} size={1} color="#e2e8f0" />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap 
              position="bottom-right"
              nodeStrokeWidth={3}
              nodeColor={(n) => {
                const status = (n.data as any)?.status;
                if (status === 'completed') return '#10b981';
                if (status === 'running') return '#3b82f6';
                if (status === 'waiting_approval') return '#f59e0b';
                return '#94a3b8';
              }}
              className="!border !border-slate-200 !rounded-lg !bg-white !shadow-sm !bottom-24"
            />
          </ReactFlow>

          {/* Quick Legend Bar */}
          <div className="absolute top-4 left-6 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-xs flex items-center gap-4 text-xs font-medium text-slate-600 pointer-events-none">
            <span className="text-slate-400">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> Running
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Awaiting Approval
            </span>
          </div>
        </div>

        {/* Agent Details Inspector Side Panel */}
        {selectedAgentId && selectedStep && (
          <aside className="w-96 border-l border-slate-200 bg-white flex flex-col h-full shadow-lg z-10 animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedStep.agentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAgentId(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Status and Performance Pill */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedStep.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Execution Latency</span>
                  <span className="font-mono tabular-nums text-slate-800 font-medium">
                    {selectedStep.executionDurationMs 
                      ? `${(selectedStep.executionDurationMs / 1000).toFixed(2)}s` 
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Current Task */}
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
                  Assigned Directive
                </span>
                <p className="text-slate-800 font-medium bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  {selectedStep.currentTask}
                </p>
              </div>

              {/* LLM Reasoning & Rationale */}
              {selectedStep.llmRationale && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    LLM Decision Rationale
                  </span>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs leading-relaxed font-sans border border-slate-800">
                    {selectedStep.llmRationale}
                  </div>
                </div>
              )}

              {/* Structured JSON Output */}
              {selectedStep.outputGenerated && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-blue-500" />
                    Structured Agent Output
                  </span>
                  <pre className="bg-slate-50 p-3 rounded-lg text-[11px] font-mono text-slate-800 border border-slate-200 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedStep.outputGenerated, null, 2)}
                  </pre>
                </div>
              )}

              {/* Input Received */}
              {selectedStep.inputReceived && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
                    Input Received From Upstream Agent
                  </span>
                  <pre className="bg-slate-50 p-2.5 rounded-lg text-[11px] font-mono text-slate-700 border border-slate-200 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedStep.inputReceived, null, 2)}
                  </pre>
                </div>
              )}

              {/* Execution Logs */}
              {selectedStep.logs && selectedStep.logs.length > 0 && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-500" />
                    Execution Event Trace
                  </span>
                  <div className="bg-slate-950 text-emerald-400 p-2.5 rounded-lg text-[11px] font-mono space-y-1">
                    {selectedStep.logs.map((log, i) => (
                      <div key={i} className="truncate">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Chronological Workflow Timeline Strip */}
      <div className="h-24 bg-white border-t border-slate-200 px-6 py-2.5 shrink-0 overflow-x-auto flex items-center">
        <div className="flex items-center gap-6 min-w-max">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0 pr-2 border-r border-slate-200">
            Timeline
          </div>

          {workflow?.timeline && workflow.timeline.length > 0 ? (
            workflow.timeline.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    item.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                    item.status === 'error' ? 'bg-rose-100 text-rose-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 leading-tight">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {item.description}
                    </p>
                  </div>
                </div>

                {idx < workflow.timeline.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400">
              No timeline steps recorded yet. Click &quot;Run Live Pipeline&quot; to execute agents.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
