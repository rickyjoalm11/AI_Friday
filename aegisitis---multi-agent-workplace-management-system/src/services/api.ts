import { 
  Ticket, WorkflowExecution, AgentProfile, KnowledgeBaseArticle, 
  Employee, NotificationItem, InterAgentMessage, DashboardMetrics 
} from '../types';

const API_BASE = '/api';

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to load metrics');
  return res.json();
}

export async function fetchTickets(filters?: { status?: string; category?: string; priority?: string; search?: string }): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/tickets?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load tickets');
  return res.json();
}

export async function fetchTicket(id: string): Promise<{ ticket: Ticket; workflow?: WorkflowExecution }> {
  const res = await fetch(`${API_BASE}/tickets/${id}`);
  if (!res.ok) throw new Error(`Failed to load ticket ${id}`);
  return res.json();
}

export async function createTicket(payload: {
  title: string;
  description: string;
  category: string;
  priority: string;
  employeeId: string;
  employeeName: string;
  department: string;
  deviceType: string;
  officeLocation: string;
}): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit ticket');
  }
  return res.json();
}

export async function approveTicket(id: string, approverName: string = 'IT Operations Director'): Promise<{ ticket: Ticket; workflow: WorkflowExecution }> {
  const res = await fetch(`${API_BASE}/tickets/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approverName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to approve action');
  }
  return res.json();
}

export async function rejectTicket(id: string, reason: string): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to reject action');
  return res.json();
}

export async function escalateTicket(id: string, reason: string): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to escalate ticket');
  return res.json();
}

export async function fetchAgents(): Promise<AgentProfile[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error('Failed to load agents');
  return res.json();
}

export async function fetchInterAgentMessages(): Promise<InterAgentMessage[]> {
  const res = await fetch(`${API_BASE}/agents/messages`);
  if (!res.ok) throw new Error('Failed to load agent messages');
  return res.json();
}

export async function fetchWorkflow(ticketId: string): Promise<WorkflowExecution> {
  const res = await fetch(`${API_BASE}/workflows/${ticketId}`);
  if (!res.ok) throw new Error(`Failed to load workflow for ${ticketId}`);
  return res.json();
}

export async function rerunWorkflow(ticketId: string): Promise<WorkflowExecution> {
  const res = await fetch(`${API_BASE}/workflows/${ticketId}/rerun`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to rerun workflow');
  return res.json();
}

export async function fetchKB(query?: string, category?: string): Promise<KnowledgeBaseArticle[]> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);

  const res = await fetch(`${API_BASE}/kb?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load knowledge base');
  return res.json();
}

export async function createKBArticle(payload: {
  title: string;
  category: string;
  description: string;
  troubleshootingSteps: string[];
  solution: string;
  tags: string[];
}): Promise<KnowledgeBaseArticle> {
  const res = await fetch(`${API_BASE}/kb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create article');
  return res.json();
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error('Failed to load employees');
  return res.json();
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
}

// WebSocket Event Bus Manager
type Listener = (event: string, payload: any) => void;

class WebSocketBus {
  private socket: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;

  connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach(fn => fn(parsed.event, parsed.payload));
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    if (!this.socket) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const wsBus = new WebSocketBus();
