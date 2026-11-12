import React, { useState, useEffect } from 'react';
import { 
  Laptop, Wifi, KeyRound, DownloadCloud, Mail, 
  Send, Sparkles, CheckCircle2, ArrowRight, UserCheck, 
  MapPin, Monitor, Building, AlertCircle
} from 'lucide-react';
import { Employee, TicketCategory, TicketPriority } from '../../types';
import { DEMO_PRESETS } from '../../data/initialData';
import { fetchEmployees, createTicket } from '../../services/api';

interface EmployeePortalViewProps {
  onTicketSubmitted: (ticketId: string) => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({ onTicketSubmitted }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('EMP-101');
  
  // Form fields
  const [employeeName, setEmployeeName] = useState<string>('Sophia Lin');
  const [department, setDepartment] = useState<string>('Engineering');
  const [deviceType, setDeviceType] = useState<string>('MacBook Pro 16" M3 Max');
  const [officeLocation, setOfficeLocation] = useState<string>('Building A - Floor 4');
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [category, setCategory] = useState<TicketCategory>('Network and Wi-Fi');
  const [priority, setPriority] = useState<TicketPriority>('High');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees().then(list => {
      setEmployees(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedEmployeeId(first.id);
        setEmployeeName(first.name);
        setDepartment(first.department);
        setDeviceType(first.deviceType);
        setOfficeLocation(first.officeLocation);
      }
    });
  }, []);

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name);
      setDepartment(emp.department);
      setDeviceType(emp.deviceType);
      setOfficeLocation(emp.officeLocation);
    }
  };

  const applyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    handleEmployeeChange(preset.employeeId);
    setCategory(preset.category);
    setPriority(preset.priority);
    setIssueTitle(preset.issueTitle);
    setIssueDescription(preset.issueDescription);
    setDeviceType(preset.deviceType);
    setOfficeLocation(preset.officeLocation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) return;

    try {
      setSubmitting(true);
      const created = await createTicket({
        title: issueTitle,
        description: issueDescription,
        category,
        priority,
        employeeId: selectedEmployeeId,
        employeeName,
        department,
        deviceType,
        officeLocation
      });

      setSubmittedTicketId(created.id);
      // Automatically navigate to workflow after slight delay or let user click
      setTimeout(() => {
        onTicketSubmitted(created.id);
      }, 1200);
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Employee IT Support Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Raise hardware, software, security, or network tickets. Autonomous AI agents immediately commence triage and resolution.
        </p>
      </div>

      {/* 5 Quick Scenario Presets */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Ready-to-Test Enterprise Scenarios (1-Click Auto-Fill)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="p-3 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                {p.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {p.category}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-2 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Load Preset →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee & Hardware Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Employee Profile
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Workstation
              </label>
              <input
                type="text"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="e.g. MacBook Pro 16 M3 Max"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Office Location
              </label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="e.g. Building A - Floor 4"
                required
              />
            </div>
          </div>

          {/* Issue Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="Hardware">Hardware</option>
                <option value="Network and Wi-Fi">Network and Wi-Fi</option>
                <option value="Password and Access">Password and Access</option>
                <option value="Software Installation">Software Installation</option>
                <option value="Email Issues">Email Issues</option>
                <option value="System Performance">System Performance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="Low">Low - Minor inconvenience</option>
                <option value="Medium">Medium - Normal workflow hindrance</option>
                <option value="High">High - Significant work stoppage</option>
                <option value="Critical">Critical - Production / Department blocked</option>
              </select>
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Summary
            </label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="e.g. Cannot connect to corp-secure Wi-Fi in West Wing"
              required
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description & Observed Symptoms
            </label>
            <textarea
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
              placeholder="Explain what happened, any error dialogs received, error codes, and troubleshooting steps already attempted..."
              required
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Coordinator Agent will validate and launch autonomous pipeline immediately upon submission.
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:scale-98 transition-all shadow-xs disabled:bg-slate-400"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                  Initializing Agent Pipeline...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request & Launch AI Agents
                </>
              )}
            </button>
          </div>
        </form>

        {submittedTicketId && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Ticket {submittedTicketId} Created Successfully!
                </h4>
                <p className="text-xs text-emerald-700">
                  Coordinator Agent initialized. Redirecting to live interactive workflow visualization...
                </p>
              </div>
            </div>

            <button
              onClick={() => onTicketSubmitted(submittedTicketId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              Inspect Workflow Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
