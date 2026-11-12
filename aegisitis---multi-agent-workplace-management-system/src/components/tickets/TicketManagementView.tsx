import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Eye, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, ArrowUpRight, X, Check, ShieldCheck, 
  ArrowRight, User, Sparkles
} from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../types';
import { fetchTickets, approveTicket, rejectTicket, escalateTicket, wsBus } from '../../services/api';

interface TicketManagementViewProps {
  onOpenWorkflow: (ticketId: string) => void;
}

export const TicketManagementView: React.FC<TicketManagementViewProps> = ({ onOpenWorkflow }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Escalation prompt modal
  const [escalateModalOpen, setEscalateModalOpen] = useState<boolean>(false);
  const [escalationReason, setEscalationReason] = useState<string>('');

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search
      });
      setTickets(data);
      // Keep selected ticket in sync if open
      if (selectedTicket) {
        const found = data.find(t => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, search, selectedTicket]);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    const unsub = wsBus.subscribe(() => {
      loadTickets();
    });
    return () => unsub();
  }, [loadTickets]);

  const handleApprove = async (ticketId: string) => {
    try {
      setActionLoading(true);
      const res = await approveTicket(ticketId, 'IT Operations Lead');
      setSelectedTicket(res.ticket);
      await loadTickets();
    } catch (e) {
      console.error('Approval failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (ticketId: string) => {
    try {
      setActionLoading(true);
      const res = await rejectTicket(ticketId, 'Denied due to enterprise security compliance policy.');
      setSelectedTicket(res);
      await loadTickets();
    } catch (e) {
      console.error('Rejection failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (ticketId: string) => {
    if (!escalationReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await escalateTicket(ticketId, escalationReason);
      setSelectedTicket(res);
      setEscalateModalOpen(false);
      setEscalationReason('');
      await loadTickets();
    } catch (e) {
      console.error('Escalation failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            IT Service Ticket Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise incident and service request queue with autonomous triage, authorization governance, and escalation controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <span>Total Ingest: <strong className="text-slate-900">{tickets.length}</strong></span>
          <span>·</span>
          <span>Pending Sign-Off: <strong className="text-amber-600">{tickets.filter(t => t.status === 'Pending Approval').length}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, employee, title..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          <option value="Hardware">Hardware</option>
          <option value="Network and Wi-Fi">Network and Wi-Fi</option>
          <option value="Password and Access">Password and Access</option>
          <option value="Software Installation">Software Installation</option>
          <option value="Email Issues">Email Issues</option>
          <option value="System Performance">System Performance</option>
          <option value="Other">Other</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No tickets match your filter criteria.
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {ticket.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{ticket.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{ticket.department}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ticket.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        ticket.priority === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        ticket.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                        ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        ticket.status === 'Pending Approval' ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' :
                        ticket.status === 'Escalated' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {ticket.status === 'Pending Approval' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {ticket.assignedAgent}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onOpenWorkflow(ticket.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          Workflow →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-500">{selectedTicket.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    selectedTicket.status === 'Pending Approval' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee</span>
                <span className="font-semibold text-slate-900">{selectedTicket.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                <span className="font-medium text-slate-800">{selectedTicket.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Workstation</span>
                <span className="font-medium text-slate-800 truncate block">{selectedTicket.deviceType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                <span className="font-medium text-slate-800">{selectedTicket.officeLocation}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observed Issue Symptoms
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 p-3 rounded-xl">
                {selectedTicket.description}
              </p>
            </div>

            {/* Pending Approval Section */}
            {selectedTicket.status === 'Pending Approval' && selectedTicket.approvalDetails && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Administrative Authorization Required
                  </h4>
                </div>
                <div className="text-xs text-amber-900 space-y-1">
                  <div><strong>Action:</strong> {selectedTicket.approvalDetails.action}</div>
                  <div><strong>Reason:</strong> {selectedTicket.approvalDetails.reason}</div>
                  <div><strong>Risk Profile:</strong> {selectedTicket.approvalDetails.risk}</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                  <button
                    onClick={() => handleReject(selectedTicket.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTicket.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {actionLoading ? 'Executing...' : 'Approve & Execute Action'}
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Summary if resolved */}
            {selectedTicket.resolutionSummary && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Autonomous Resolution Summary
                  </h4>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {selectedTicket.resolutionSummary}
                </p>
              </div>
            )}

            {/* Escalation reason if escalated */}
            {selectedTicket.escalationReason && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Escalation Details
                  </h4>
                </div>
                <p className="text-xs text-purple-950 leading-relaxed">
                  {selectedTicket.escalationReason}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              {selectedTicket.status !== 'Escalated' && selectedTicket.status !== 'Resolved' && (
                <button
                  onClick={() => setEscalateModalOpen(true)}
                  className="px-3 py-1.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                >
                  Escalate to Human Tier-3 Lead
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    const id = selectedTicket.id;
                    setSelectedTicket(null);
                    onOpenWorkflow(id);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors font-semibold shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Inspect in Workflow Canvas →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Prompt Modal */}
      {escalateModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Escalate {selectedTicket.id} to Tier-3 Human Lead
            </h3>
            <p className="text-xs text-slate-500">
              Transfer ticket out of autonomous agent pipeline to on-call human specialists for manual troubleshooting.
            </p>
            <textarea
              rows={3}
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="State reason for human escalation (e.g. requires physical datacenter access, high financial risk)..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEscalate(selectedTicket.id)}
                disabled={actionLoading || !escalationReason.trim()}
                className="px-4 py-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
