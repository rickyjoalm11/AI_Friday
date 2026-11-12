import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { store } from './src/server/store';
import { agentOrchestrator, setEventBroadcaster } from './src/server/agentOrchestrator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// Track active WebSocket clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);

  // Send initial handshake
  ws.send(JSON.stringify({
    event: 'connected',
    payload: {
      message: 'Connected to AegisITIS Real-time Multi-Agent Event Bus',
      timestamp: new Date().toISOString()
    }
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
    clients.delete(ws);
  });
});

// Register broadcaster
setEventBroadcaster((event: string, payload: any) => {
  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
});

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AegisITIS Multi-Agent Workplace Management',
    geminiActive: !!process.env.GEMINI_API_KEY,
    activeWsClients: clients.size,
    timestamp: new Date().toISOString()
  });
});

// Metrics
app.get('/api/metrics', (req: Request, res: Response) => {
  const metrics = store.getDashboardMetrics();
  res.json(metrics);
});

// Tickets
app.get('/api/tickets', (req: Request, res: Response) => {
  const { status, category, priority, search } = req.query as Record<string, string>;
  const tickets = store.getTickets({ status, category, priority, search });
  res.json(tickets);
});

app.get('/api/tickets/:id', (req: Request, res: Response) => {
  const ticket = store.getTicket(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  const workflow = store.getWorkflow(ticket.id);
  res.json({ ticket, workflow });
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { 
      title, description, category, priority, 
      employeeId, employeeName, department, deviceType, officeLocation 
    } = req.body;

    if (!title || !description || !employeeName) {
      return res.status(400).json({ error: 'Title, description, and employee are required' });
    }

    const created = store.createTicket({
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      status: 'Open',
      employeeId: employeeId || 'EMP-101',
      employeeName,
      department: department || 'Engineering',
      deviceType: deviceType || 'Enterprise Laptop',
      officeLocation: officeLocation || 'Headquarters',
      assignedAgent: 'Coordinator Agent'
    });

    store.addNotification({
      ticketId: created.id,
      title: `Ticket Submitted: ${created.title}`,
      message: `Ticket ${created.id} received. Coordinator Agent has initiated the autonomous triage pipeline.`,
      type: 'creation',
      recipient: created.employeeName
    });

    // Run multi-agent workflow in background so client receives ticket immediately
    setTimeout(() => {
      agentOrchestrator.runWorkflow(created.id).catch(err => {
        console.error(`Workflow failure on ${created.id}:`, err);
      });
    }, 100);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create ticket' });
  }
});

// Approve sensitive ticket operation
app.post('/api/tickets/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approverName } = req.body;
    const ticketId = req.params.id;
    const workflow = await agentOrchestrator.approveAndResumeWorkflow(ticketId, approverName || 'IT Systems Director');
    const ticket = store.getTicket(ticketId);
    res.json({ success: true, ticket, workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject sensitive ticket operation
app.post('/api/tickets/:id/reject', (req: Request, res: Response) => {
  const { reason, rejectedBy } = req.body;
  const ticket = store.getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (ticket.approvalDetails) {
    ticket.approvalDetails.status = 'rejected';
    ticket.approvalDetails.reason = reason || 'Declined by IT Operations Administrator';
  }

  const updated = store.updateTicket(ticket.id, {
    status: 'Closed',
    requiresApproval: false,
    resolutionSummary: `Operation rejected: ${reason || 'Administrative policy constraint.'}`
  });

  store.addNotification({
    ticketId: ticket.id,
    title: `Remediation Rejected: ${ticket.title}`,
    message: `The pending remediation action was declined by ${rejectedBy || 'IT Admin'}: ${reason || 'Contact IT Help Desk for alternatives.'}`,
    type: 'approval_required',
    recipient: ticket.employeeName
  });

  res.json(updated);
});

// Escalate ticket
app.post('/api/tickets/:id/escalate', (req: Request, res: Response) => {
  const { reason } = req.body;
  const ticket = store.getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updated = store.updateTicket(ticket.id, {
    status: 'Escalated',
    assignedAgent: 'Human Tier-3 Lead',
    escalationReason: reason || 'Manual escalation requested by operator'
  });

  const wf = store.getWorkflow(ticket.id);
  if (wf) {
    wf.status = 'escalated';
    wf.timeline.push({
      timestamp: new Date().toISOString(),
      title: 'Manually Escalated',
      description: `Escalated to Tier 3 human engineering: ${reason || 'Requires manual on-site intervention'}`,
      status: 'error'
    });
    store.saveWorkflow(wf);
  }

  store.addNotification({
    ticketId: ticket.id,
    title: `Ticket Escalated: ${ticket.title}`,
    message: `Ticket ${ticket.id} transferred to Tier-3 Human Lead: ${reason || 'Assigned to specialist on-call.'}`,
    type: 'escalated',
    recipient: ticket.employeeName
  });

  res.json(updated);
});

// Agents & Messages
app.get('/api/agents', (req: Request, res: Response) => {
  res.json(store.getAgents());
});

app.get('/api/agents/messages', (req: Request, res: Response) => {
  res.json(store.getInterAgentMessages());
});

// Workflows
app.get('/api/workflows/:ticketId', (req: Request, res: Response) => {
  const wf = store.getWorkflow(req.params.ticketId);
  if (!wf) {
    return res.status(404).json({ error: 'No workflow found for this ticket' });
  }
  res.json(wf);
});

app.post('/api/workflows/:ticketId/rerun', async (req: Request, res: Response) => {
  try {
    const wf = await agentOrchestrator.runWorkflow(req.params.ticketId);
    res.json(wf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Knowledge Base
app.get('/api/kb', (req: Request, res: Response) => {
  const { q, category } = req.query as Record<string, string>;
  res.json(store.getKBArticles(q, category));
});

app.get('/api/kb/:id', (req: Request, res: Response) => {
  const article = store.getKBArticle(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

app.post('/api/kb', (req: Request, res: Response) => {
  const { title, category, description, troubleshootingSteps, solution, tags } = req.body;
  if (!title || !description || !solution) {
    return res.status(400).json({ error: 'Title, description, and solution are required' });
  }
  const created = store.addKBArticle({
    title,
    category: category || 'Other',
    description,
    troubleshootingSteps: troubleshootingSteps || [],
    solution,
    tags: tags || []
  });
  res.status(201).json(created);
});

// Employees
app.get('/api/employees', (req: Request, res: Response) => {
  res.json(store.getEmployees());
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(store.getNotifications());
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  store.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  store.markAllNotificationsRead();
  res.json({ success: true });
});

// Server Setup & Dev Middlewares
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AegisITIS] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[AegisITIS] WebSocket available at ws://0.0.0.0:${PORT}/ws`);
    console.log(`[AegisITIS] Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
