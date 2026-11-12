import fs from 'fs';
import path from 'path';
import { 
  Employee, Ticket, KnowledgeBaseArticle, AgentProfile, 
  WorkflowExecution, NotificationItem, InterAgentMessage, DashboardMetrics 
} from '../types';
import { 
  INITIAL_EMPLOYEES, INITIAL_TICKETS, INITIAL_AGENTS, 
  INITIAL_KB_ARTICLES, INITIAL_NOTIFICATIONS, INITIAL_INTER_AGENT_MESSAGES 
} from '../data/initialData';

interface StoreData {
  employees: Employee[];
  tickets: Ticket[];
  agents: AgentProfile[];
  kbArticles: KnowledgeBaseArticle[];
  workflows: Record<string, WorkflowExecution>;
  notifications: NotificationItem[];
  interAgentMessages: InterAgentMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

class DataStore {
  private data: StoreData;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): StoreData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tickets && parsed.agents) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing store.json, re-initializing with seed data:', err);
    }

    const initialWorkflows: Record<string, WorkflowExecution> = {};
    // Seed initial workflow for TKT-1002 (Waiting approval)
    initialWorkflows['TKT-1002'] = {
      id: 'WF-1002',
      ticketId: 'TKT-1002',
      status: 'waiting_approval',
      startedAt: '2026-11-12T07:53:00Z',
      currentAgentId: 'resolution_agent',
      steps: {
        coordinator_agent: {
          agentId: 'coordinator_agent',
          agentName: 'Coordinator Agent',
          status: 'completed',
          startedAt: '2026-11-12T07:53:00Z',
          completedAt: '2026-11-12T07:53:01Z',
          executionDurationMs: 820,
          currentTask: 'Validated employee ticket and initiated pipeline',
          inputReceived: { ticketId: 'TKT-1002', employeeId: 'EMP-101' },
          outputGenerated: { valid: true, priority: 'High', dispatchedTo: 'classification_agent' },
          decisionSummary: 'Employee identity and device confirmed. Dispatching to classification agent.',
          llmRationale: 'Ticket contains valid network failure symptoms on critical engineering workstation. High priority triage assigned.',
          logs: ['[07:53:00] Ticket payload validated', '[07:53:01] Dispatched to Classification Agent']
        },
        classification_agent: {
          agentId: 'classification_agent',
          agentName: 'Classification Agent',
          status: 'completed',
          startedAt: '2026-11-12T07:53:01Z',
          completedAt: '2026-11-12T07:53:02Z',
          executionDurationMs: 1420,
          currentTask: 'Categorized issue and determined severity',
          inputReceived: { title: 'Cannot connect to corp-secure Wi-Fi in West Wing Building A' },
          outputGenerated: {
            category: 'Network and Wi-Fi',
            subcategory: '802.1X Enterprise Authentication',
            priority: 'High',
            severity: 'Medium',
            confidence: 0.96,
            affectedService: 'WLAN Access Points Building A'
          },
          decisionSummary: 'Classified as 802.1X Enterprise Wi-Fi authentication failure with High priority.',
          llmRationale: 'Symptom description matches known RADIUS authentication profile dropouts in West Wing area.',
          logs: ['[07:53:01] Processing natural language tokens', '[07:53:02] Taxonomy matched: Network and Wi-Fi / 802.1X']
        },
        troubleshooting_agent: {
          agentId: 'troubleshooting_agent',
          agentName: 'Troubleshooting Agent',
          status: 'completed',
          startedAt: '2026-11-12T07:53:02Z',
          completedAt: '2026-11-12T07:53:04Z',
          executionDurationMs: 1950,
          currentTask: 'Diagnosed root cause and identified diagnostic steps',
          inputReceived: { category: 'Network and Wi-Fi', subcategory: '802.1X Enterprise Authentication' },
          outputGenerated: {
            rootCause: 'Expired or desynchronized PEAP client certificate on local macOS keychain',
            diagnosticSteps: ['Inspect system keychain for expired root CA', 'Check client RADIUS handshake logs'],
            riskLevel: 'Medium',
            automationEligibility: true,
            escalationNeeded: false
          },
          decisionSummary: 'Root cause identified as expired 802.1X PEAP client certificate.',
          llmRationale: 'Frequent disconnects with credential reprompts on managed MacBooks typically point to expired MDM identity certificates rather than physical AP hardware faults.',
          logs: ['[07:53:02] Running diagnostic rule engine', '[07:53:04] Probable root cause isolate: Certificate desync']
        },
        knowledge_base_agent: {
          agentId: 'knowledge_base_agent',
          agentName: 'Knowledge Base Agent',
          status: 'completed',
          startedAt: '2026-11-12T07:53:04Z',
          completedAt: '2026-11-12T07:53:05Z',
          executionDurationMs: 1050,
          currentTask: 'Matched KB-1001 Enterprise Wi-Fi Certificate Renewal',
          inputReceived: { keywords: ['wifi', 'certificate', '802.1x', 'radius'] },
          outputGenerated: {
            articleId: 'KB-1001',
            articleTitle: 'Enterprise Wi-Fi 802.1X Certificate Renewal & Profile Re-enrollment',
            confidence: 0.98,
            recommendedSolution: 'Re-push MDM Wi-Fi profile and purge expired identity keychain credentials.'
          },
          decisionSummary: 'Retrieved KB-1001 with 98% semantic relevance.',
          llmRationale: 'Standard operating procedure KB-1001 explicitly outlines automated certutil purge and Jamf profile re-enrollment.',
          logs: ['[07:53:04] Querying internal IT repository', '[07:53:05] Retrieved KB-1001 (Match confidence: 98%)']
        },
        resolution_agent: {
          agentId: 'resolution_agent',
          agentName: 'Resolution Agent',
          status: 'waiting_approval',
          startedAt: '2026-11-12T07:53:05Z',
          currentTask: 'Awaiting IT Administrator Approval for MDM Certificate Push',
          inputReceived: { articleId: 'KB-1001', rootCause: 'Expired 802.1X cert' },
          outputGenerated: {
            remediationPlan: 'Deploy updated enterprise 802.1X Wi-Fi client certificates via Jamf MDM API',
            requiresApproval: true,
            approvalRisk: 'Medium',
            actionDescription: 'Re-push enterprise 802.1X Wi-Fi client certificates via Jamf MDM API'
          },
          decisionSummary: 'Remediation plan formulated. MDM certificate push requires administrator approval token.',
          llmRationale: 'Pushing MDM configuration profiles modifies device security certificates and requires human IT administrator sign-off per corporate policy.',
          logs: ['[07:53:05] Formulating execution commands', '[07:53:06] Security policy check: Action requires approval', '[07:53:06] Status set to Pending Approval']
        },
        notification_agent: {
          agentId: 'notification_agent',
          agentName: 'Notification Agent',
          status: 'idle',
          currentTask: 'Standby for resolution approval notification dispatch',
          logs: ['[07:53:06] Awaiting approval or completion trigger']
        }
      },
      timeline: [
        { timestamp: '2026-11-12T07:53:00Z', title: 'Request Submitted', description: 'Sophia Lin raised ticket TKT-1002 for Wi-Fi dropouts.', status: 'info' },
        { timestamp: '2026-11-12T07:53:01Z', title: 'Coordinator Initialized', description: 'Workflow WF-1002 created and assigned to Classification Agent.', status: 'info', agentId: 'coordinator_agent' },
        { timestamp: '2026-11-12T07:53:02Z', title: 'Classification Completed', description: 'Classified as Network and Wi-Fi (802.1X Auth Failure) with High priority.', status: 'success', agentId: 'classification_agent' },
        { timestamp: '2026-11-12T07:53:04Z', title: 'Troubleshooting Completed', description: 'Diagnosed root cause: Expired 802.1X PEAP client certificate.', status: 'success', agentId: 'troubleshooting_agent' },
        { timestamp: '2026-11-12T07:53:05Z', title: 'Knowledge Base Matched', description: 'Retrieved KB-1001 with 98% confidence score.', status: 'success', agentId: 'knowledge_base_agent' },
        { timestamp: '2026-11-12T07:53:06Z', title: 'Approval Required', description: 'Resolution Agent formulated plan. Awaiting IT Admin approval for MDM certificate push.', status: 'warning', agentId: 'resolution_agent' }
      ]
    };

    const initialData: StoreData = {
      employees: INITIAL_EMPLOYEES,
      tickets: INITIAL_TICKETS,
      agents: INITIAL_AGENTS,
      kbArticles: INITIAL_KB_ARTICLES,
      workflows: initialWorkflows,
      notifications: INITIAL_NOTIFICATIONS,
      interAgentMessages: INITIAL_INTER_AGENT_MESSAGES
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: StoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store.json to disk:', err);
    }
  }

  // Employees
  getEmployees(): Employee[] {
    return this.data.employees;
  }

  getEmployee(id: string): Employee | undefined {
    return this.data.employees.find(e => e.id === id);
  }

  // Tickets
  getTickets(filters?: { status?: string; category?: string; priority?: string; search?: string }): Ticket[] {
    let list = [...this.data.tickets];
    if (filters?.status && filters.status !== 'All') {
      list = list.filter(t => t.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.category && filters.category !== 'All') {
      list = list.filter(t => t.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.priority && filters.priority !== 'All') {
      list = list.filter(t => t.priority.toLowerCase() === filters.priority!.toLowerCase());
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.employeeName.toLowerCase().includes(q)
      );
    }
    // Return latest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTicket(id: string): Ticket | undefined {
    return this.data.tickets.find(t => t.id === id);
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Ticket {
    const nextNum = this.data.tickets.length + 1001;
    const newId = `TKT-${nextNum}`;
    const now = new Date().toISOString();
    const created: Ticket = {
      ...ticket,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.tickets.unshift(created);
    this.saveData();
    return created;
  }

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const idx = this.data.tickets.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.data.tickets[idx] = {
      ...this.data.tickets[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return this.data.tickets[idx];
  }

  // Workflows
  getWorkflow(ticketId: string): WorkflowExecution | undefined {
    return this.data.workflows[ticketId];
  }

  saveWorkflow(wf: WorkflowExecution) {
    this.data.workflows[wf.ticketId] = wf;
    this.saveData();
  }

  // Agents
  getAgents(): AgentProfile[] {
    return this.data.agents;
  }

  updateAgent(id: string, updates: Partial<AgentProfile>) {
    const idx = this.data.agents.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.agents[idx] = { ...this.data.agents[idx], ...updates };
      this.saveData();
    }
  }

  // Inter-agent messages
  getInterAgentMessages(): InterAgentMessage[] {
    return this.data.interAgentMessages.slice(0, 50);
  }

  addInterAgentMessage(msg: Omit<InterAgentMessage, 'id' | 'timestamp'>) {
    const newMsg: InterAgentMessage = {
      ...msg,
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.data.interAgentMessages.unshift(newMsg);
    if (this.data.interAgentMessages.length > 100) {
      this.data.interAgentMessages.pop();
    }
    this.saveData();
    return newMsg;
  }

  // Knowledge Base
  getKBArticles(query?: string, category?: string): KnowledgeBaseArticle[] {
    let list = [...this.data.kbArticles];
    if (category && category !== 'All') {
      list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(a => 
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getKBArticle(id: string): KnowledgeBaseArticle | undefined {
    return this.data.kbArticles.find(a => a.id === id);
  }

  addKBArticle(article: Omit<KnowledgeBaseArticle, 'id' | 'updatedAt' | 'viewsCount'>): KnowledgeBaseArticle {
    const nextId = `KB-${this.data.kbArticles.length + 1001}`;
    const newArt: KnowledgeBaseArticle = {
      ...article,
      id: nextId,
      updatedAt: new Date().toISOString().split('T')[0],
      viewsCount: 1
    };
    this.data.kbArticles.push(newArt);
    this.saveData();
    return newArt;
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) {
    const newNotif: NotificationItem = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    this.data.notifications.unshift(newNotif);
    this.saveData();
    return newNotif;
  }

  markNotificationRead(id: string) {
    const item = this.data.notifications.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveData();
    }
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach(n => { n.read = true; });
    this.saveData();
  }

  // Analytics Metrics
  getDashboardMetrics(): DashboardMetrics {
    const total = this.data.tickets.length;
    const active = this.data.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending Approval').length;
    const resolved = this.data.tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const pendingApproval = this.data.tickets.filter(t => t.status === 'Pending Approval').length;
    const highPriority = this.data.tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
    const activeAgents = this.data.agents.filter(a => a.currentStatus === 'running' || a.currentStatus === 'idle').length;

    // Categories
    const categoryCounts: Record<string, number> = {};
    this.data.tickets.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    const ticketsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

    // Priorities
    const priorityCounts: Record<string, number> = {};
    this.data.tickets.forEach(t => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });
    const ticketsByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));

    // Trends (synthetic last 7 days)
    const ticketTrends = [
      { date: 'Nov 06', submitted: 8, resolved: 7 },
      { date: 'Nov 07', submitted: 12, resolved: 10 },
      { date: 'Nov 08', submitted: 9, resolved: 9 },
      { date: 'Nov 09', submitted: 14, resolved: 12 },
      { date: 'Nov 10', submitted: 11, resolved: 11 },
      { date: 'Nov 11', submitted: 15, resolved: 13 },
      { date: 'Nov 12', submitted: 7, resolved: 5 }
    ];

    const agentPerformance = this.data.agents.map(a => ({
      name: a.name.replace(' Agent', ''),
      completed: a.tasksCompleted,
      avgTimeSec: parseFloat((a.averageExecutionTimeMs / 1000).toFixed(2))
    }));

    return {
      totalTickets: total,
      activeTickets: active,
      resolvedTickets: resolved,
      pendingApprovalTickets: pendingApproval,
      highPriorityTickets: highPriority,
      activeAgents,
      resolutionRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      averageResolutionMinutes: 18,
      ticketsByCategory,
      ticketsByPriority,
      ticketTrends,
      agentPerformance
    };
  }
}

export const store = new DataStore();
