export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketCategory = 
  | 'Hardware' 
  | 'Network and Wi-Fi' 
  | 'Password and Access' 
  | 'Software Installation' 
  | 'Email Issues' 
  | 'System Performance' 
  | 'Other';

export type TicketStatus = 
  | 'Open' 
  | 'In Progress' 
  | 'Pending Approval' 
  | 'Resolved' 
  | 'Escalated' 
  | 'Closed';

export type AgentId = 
  | 'coordinator_agent'
  | 'classification_agent'
  | 'troubleshooting_agent'
  | 'knowledge_base_agent'
  | 'resolution_agent'
  | 'notification_agent';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'waiting_approval' | 'failed' | 'escalated';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: 'Human Resources' | 'Finance' | 'Engineering' | 'Marketing' | 'Operations' | 'Administration';
  role: string;
  officeLocation: string;
  deviceType: string;
  avatarUrl?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  employeeId: string;
  employeeName: string;
  department: string;
  deviceType: string;
  officeLocation: string;
  assignedAgent: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  requiresApproval?: boolean;
  approvalDetails?: {
    action: string;
    risk: 'Low' | 'Medium' | 'High';
    requestedBy: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    approvedBy?: string;
    approvedAt?: string;
  };
  resolutionSummary?: string;
  escalationReason?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: TicketCategory;
  description: string;
  troubleshootingSteps: string[];
  solution: string;
  tags: string[];
  updatedAt: string;
  viewsCount: number;
}

export interface AgentStepExecution {
  agentId: AgentId;
  agentName: string;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  executionDurationMs?: number;
  currentTask: string;
  inputReceived?: Record<string, any>;
  outputGenerated?: Record<string, any>;
  decisionSummary?: string;
  llmRationale?: string;
  logs: string[];
}

export interface WorkflowExecution {
  id: string;
  ticketId: string;
  status: 'running' | 'completed' | 'waiting_approval' | 'escalated' | 'failed';
  startedAt: string;
  completedAt?: string;
  steps: Record<AgentId, AgentStepExecution>;
  currentAgentId?: AgentId;
  timeline: {
    timestamp: string;
    title: string;
    description: string;
    status: 'info' | 'success' | 'warning' | 'error';
    agentId?: AgentId;
  }[];
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  currentStatus: AgentStatus;
  currentTask: string;
  tasksCompleted: number;
  failedTasks: number;
  averageExecutionTimeMs: number;
  lastActive: string;
  iconName: string;
}

export interface NotificationItem {
  id: string;
  ticketId: string;
  title: string;
  message: string;
  type: 'creation' | 'progress' | 'approval_required' | 'resolved' | 'escalated';
  createdAt: string;
  read: boolean;
  recipient: string;
}

export interface InterAgentMessage {
  id: string;
  timestamp: string;
  fromAgent: string;
  toAgent: string;
  ticketId: string;
  message: string;
  payloadSummary: string;
}

export interface DashboardMetrics {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  pendingApprovalTickets: number;
  highPriorityTickets: number;
  activeAgents: number;
  resolutionRatePercent: number;
  averageResolutionMinutes: number;
  ticketsByCategory: { category: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketTrends: { date: string; submitted: number; resolved: number }[];
  agentPerformance: { name: string; completed: number; avgTimeSec: number }[];
}
