import React, { useEffect, useState, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TicketCheck, AlertCircle, Clock, CheckCircle2, 
  Flame, Bot, ArrowUpRight, TrendingUp, Cpu, 
  RefreshCw, ChevronRight, Activity, ShieldAlert
} from 'lucide-react';
import { DashboardMetrics, Ticket, AgentProfile } from '../../types';
import { fetchMetrics, fetchTickets, fetchAgents, wsBus } from '../../services/api';

interface DashboardViewProps {
  onNavigateToWorkflow: (ticketId: string) => void;
  onNavigateToPortal: () => void;
  onNavigateToTickets: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#10b981'
};

const CATEGORY_COLORS = ['#1e3a8a', '#2563eb', '#38bdf8', '#0d9488', '#6366f1', '#8b5cf6', '#d97706'];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigateToWorkflow, 
  onNavigateToPortal,
  onNavigateToTickets
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [m, t, a] = await Promise.all([
        fetchMetrics(),
        fetchTickets(),
        fetchAgents()
      ]);
      setMetrics(m);
      setRecentTickets(t.slice(0, 6));
      setAgents(a);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Re-fetch on any workflow event
    const unsubscribe = wsBus.subscribe((event) => {
      if (['ticket_created', 'workflow_completed', 'workflow_waiting_approval', 'agent_completed'].includes(event)) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500 font-medium">Loading telemetry & agent metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            IT Service Management & Agent Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise orchestration engine powered by Google Gemini 3.8 Flash multi-agent workforce.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>

          <button
            onClick={onNavigateToPortal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            Submit IT Request →
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tickets</span>
            <TicketCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.totalTickets ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Enterprise Intake</span>
          </div>
        </div>

        {/* Active Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Queue</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.activeTickets ?? 0}
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">
            In triage or resolution
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.resolvedTickets ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {metrics?.resolutionRatePercent ?? 0}% resolution SLA
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Approval</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.pendingApprovalTickets ?? 0}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Human sign-off required
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High / Critical</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.highPriorityTickets ?? 0}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Accelerated response
          </div>
        </div>

        {/* Active AI Agents */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active AI Agents</span>
            <Bot className="w-4 h-4 text-navy-800" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.activeAgents ?? 6}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            100% operational
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ticket Ingest & Resolution SLA Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Daily submitted volume vs automated AI resolution throughput (Past 7 Days)
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              Avg resolution: {metrics?.averageResolutionMinutes} min
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.ticketTrends || []}>
                <defs>
                  <linearGradient id="submittedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#submittedGrad)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#resolvedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Incident Priority Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Live triage priority queue breakdown
          </p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.ticketsByPriority || []}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(metrics?.ticketsByPriority || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            {(metrics?.ticketsByPriority || []).map(p => (
              <span key={p.priority} className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p.priority] }}></span>
                <span className="font-medium">{p.priority}:</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Live Agent Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Tickets by Service Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ITIL category classification volume
          </p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.ticketsByCategory || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live AI Agent Activity Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Live AI Agent Activity
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </h3>
              <p className="text-xs text-slate-500">
                Continuous status and latency of the six autonomous decision agents
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {agents.map(agent => (
              <div 
                key={agent.id}
                className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {agent.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {agent.role}
                    </p>
                  </div>

                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                    agent.currentStatus === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    agent.currentStatus === 'waiting_approval' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {agent.currentStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-700 line-clamp-1 mb-2 bg-white p-1.5 rounded border border-slate-200/60">
                  {agent.currentTask}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums border-t border-slate-200/50 pt-1.5">
                  <span>Completed: <strong className="text-slate-700">{agent.tasksCompleted}</strong></span>
                  <span>Avg Latency: <strong className="text-slate-700">{(agent.averageExecutionTimeMs / 1000).toFixed(2)}s</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent IT Service Requests
            </h3>
            <p className="text-xs text-slate-500">
              Latest employee tickets triaged by autonomous multi-agent pipeline
            </p>
          </div>

          <button
            onClick={onNavigateToTickets}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All Tickets ({metrics?.totalTickets}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Ticket ID</th>
                <th className="py-2.5 px-3 font-semibold">Employee</th>
                <th className="py-2.5 px-3 font-semibold">Issue Description</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Agent</th>
                <th className="py-2.5 px-3 font-semibold text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                    {t.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{t.employeeName}</div>
                    <div className="text-[11px] text-slate-400">{t.department}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-medium text-slate-800 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{t.deviceType}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {t.category}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      t.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      t.priority === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      t.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      t.status === 'Pending Approval' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      t.status === 'Escalated' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {t.assignedAgent}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onNavigateToWorkflow(t.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      Inspect Flow →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
