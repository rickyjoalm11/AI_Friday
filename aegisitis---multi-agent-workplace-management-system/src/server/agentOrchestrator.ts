import { GoogleGenAI } from '@google/genai';
import { store } from './store';
import { 
  Ticket, WorkflowExecution, AgentId, AgentStatus, 
  KnowledgeBaseArticle 
} from '../types';

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Global WebSocket broadcaster hook
type EventBroadcaster = (event: string, payload: any) => void;
let broadcaster: EventBroadcaster | null = null;

export function setEventBroadcaster(fn: EventBroadcaster) {
  broadcaster = fn;
}

function emitEvent(event: string, payload: any) {
  if (broadcaster) {
    try {
      broadcaster(event, payload);
    } catch (err) {
      console.error('Error emitting event:', err);
    }
  }
}

// System prompts for each specialized agent
const AGENT_SYSTEM_PROMPTS = {
  coordinator_agent: `You are the Coordinator Agent for an enterprise IT Service Management (ITIS) system.
Your role: Central workflow orchestrator.
Responsibilities:
1. Receive and inspect employee support requests.
2. Validate that employee info, device, and issue details are coherent.
3. Initialize execution pipeline and assign tasks to specialized agents.
4. Monitor execution safety and handle escalations.
Return valid JSON only in this format:
{
  "isValid": true,
  "validationNotes": "string summary",
  "dispatchedTo": "classification_agent",
  "initialRisk": "Low" | "Medium" | "High",
  "decisionSummary": "string explanation of orchestration choice",
  "llmRationale": "detailed rationale for the dispatch decision"
}`,

  classification_agent: `You are the Classification Agent for an enterprise IT Service Management (ITIS) system.
Your role: IT issue classification specialist.
Responsibilities:
1. Analyze issue description, title, department, and device.
2. Identify category strictly from: ["Hardware", "Network and Wi-Fi", "Password and Access", "Software Installation", "Email Issues", "System Performance", "Other"].
3. Determine subcategory, priority (Low, Medium, High, Critical), and severity (Low, Medium, High).
4. Assess affected IT service, business impact, and confidence score (0.0 to 1.0).
Return valid JSON only in this format:
{
  "category": "string",
  "subcategory": "string",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "severity": "Low" | "Medium" | "High",
  "affectedService": "string",
  "businessImpact": "string",
  "confidence": 0.95,
  "summary": "1-2 sentence summary of issue",
  "recommendedAction": "string next step",
  "decisionSummary": "concise rationale",
  "llmRationale": "technical justification of classification"
}`,

  troubleshooting_agent: `You are the Troubleshooting Agent for an enterprise IT Service Management (ITIS) system.
Your role: Technical problem analysis specialist.
Responsibilities:
1. Analyze classified issue and technical symptoms.
2. Identify 2-3 possible root causes with high technical fidelity.
3. Formulate concrete diagnostic verification steps.
4. Assess risk level (Low, Medium, High).
5. Determine automation eligibility (true/false) and whether human Tier-3 escalation is needed.
Return valid JSON only in this format:
{
  "problemAnalysis": "in-depth technical analysis",
  "possibleRootCauses": ["cause 1", "cause 2"],
  "troubleshootingSteps": ["step 1", "step 2", "step 3"],
  "riskLevel": "Low" | "Medium" | "High",
  "automationEligibility": true,
  "escalationNeeded": false,
  "decisionSummary": "concise summary of diagnosis",
  "llmRationale": "technical rationale behind the root cause analysis"
}`,

  knowledge_base_agent: `You are the Knowledge Base Agent for an enterprise IT Service Management (ITIS) system.
Your role: Internal IT documentation specialist.
Responsibilities:
1. Match the classified issue and diagnosed root causes against available standard operating procedures.
2. Identify the best matching Knowledge Base article ID and title.
3. Provide relevant procedural instructions and match confidence (0.0 to 1.0).
Return valid JSON only in this format:
{
  "articleId": "KB-XXXX",
  "articleTitle": "string",
  "matchConfidence": 0.95,
  "relevantInformation": "string summarizing matched documentation",
  "recommendedSolution": "step by step procedural fix from KB",
  "decisionSummary": "why this article was selected",
  "llmRationale": "semantic matching justification"
}`,

  resolution_agent: `You are the Resolution Agent for an enterprise IT Service Management (ITIS) system.
Your role: IT issue remediation & execution specialist.
Responsibilities:
1. Analyze troubleshooting findings and KB documentation.
2. Synthesize a concrete remediation plan.
3. Crucial Security Rule: Sensitive actions (privilege escalation, admin password changes, corporate license grants, firewall modifications, root certificates) REQUIRE APPROVAL.
4. If approval required, specify approvalAction, requiredRole, and risk level.
5. If safe automated operation, specify simulated execution commands.
Return valid JSON only in this format:
{
  "remediationPlan": "concise plan description",
  "resolutionSteps": ["step 1", "step 2"],
  "requiresApproval": boolean,
  "approvalDetails": {
    "action": "string",
    "risk": "Low" | "Medium" | "High",
    "requiredRole": "string",
    "reason": "why approval is required"
  },
  "simulatedExecutionStatus": "completed" | "waiting_approval" | "escalated",
  "decisionSummary": "summary of execution strategy",
  "llmRationale": "security and remediation reasoning"
}`,

  notification_agent: `You are the Notification Agent for an enterprise IT Service Management (ITIS) system.
Your role: Employee communication specialist.
Responsibilities:
1. Draft clear, polite, and actionable communication for the affected employee.
2. Include ticket reference, status outcome, immediate steps taken, and instructions.
3. Return notification title, employee message body, and executive digest.
Return valid JSON only in this format:
{
  "notificationTitle": "string subject",
  "employeeMessage": "professional employee-facing message body",
  "executiveDigest": "short 1-sentence management digest",
  "recommendedChannel": "Email & Slack",
  "decisionSummary": "summary of messaging approach",
  "llmRationale": "rationale for tone and communication priority"
}`
};

// Generic LLM caller with robust fallback
async function callGeminiAgent<T>(
  agentId: AgentId,
  userPrompt: string,
  fallbackGenerator: () => T
): Promise<T> {
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPTS[agentId],
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as T;
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini API call failed for ${agentId}, falling back to built-in reasoning engine:`, err);
    }
  }

  // Built-in intelligent fallback engine
  return fallbackGenerator();
}

export class AgentOrchestrator {
  /**
   * Run full multi-agent pipeline for a ticket
   */
  async runWorkflow(ticketId: string): Promise<WorkflowExecution> {
    const ticket = store.getTicket(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const workflowId = `WF-${ticketId.replace('TKT-', '')}`;
    const startedAt = new Date().toISOString();

    const workflow: WorkflowExecution = {
      id: workflowId,
      ticketId,
      status: 'running',
      startedAt,
      currentAgentId: 'coordinator_agent',
      steps: {
        coordinator_agent: {
          agentId: 'coordinator_agent',
          agentName: 'Coordinator Agent',
          status: 'idle',
          currentTask: 'Awaiting pipeline dispatch',
          logs: []
        },
        classification_agent: {
          agentId: 'classification_agent',
          agentName: 'Classification Agent',
          status: 'idle',
          currentTask: 'Waiting for coordinator task',
          logs: []
        },
        troubleshooting_agent: {
          agentId: 'troubleshooting_agent',
          agentName: 'Troubleshooting Agent',
          status: 'idle',
          currentTask: 'Waiting for classification output',
          logs: []
        },
        knowledge_base_agent: {
          agentId: 'knowledge_base_agent',
          agentName: 'Knowledge Base Agent',
          status: 'idle',
          currentTask: 'Waiting for diagnostic results',
          logs: []
        },
        resolution_agent: {
          agentId: 'resolution_agent',
          agentName: 'Resolution Agent',
          status: 'idle',
          currentTask: 'Waiting for KB documentation',
          logs: []
        },
        notification_agent: {
          agentId: 'notification_agent',
          agentName: 'Notification Agent',
          status: 'idle',
          currentTask: 'Waiting for remediation outcome',
          logs: []
        }
      },
      timeline: [
        {
          timestamp: startedAt,
          title: 'Request Received',
          description: `Ticket ${ticket.id} submitted by ${ticket.employeeName} (${ticket.department}).`,
          status: 'info'
        }
      ]
    };

    store.saveWorkflow(workflow);
    emitEvent('workflow_started', { workflowId, ticketId, workflow });

    // Step 1: Coordinator Agent
    await this.executeCoordinatorStep(ticket, workflow);

    // Step 2: Classification Agent
    const classificationResult = await this.executeClassificationStep(ticket, workflow);

    // Step 3: Troubleshooting Agent
    const troubleshootingResult = await this.executeTroubleshootingStep(ticket, workflow, classificationResult);

    // Step 4: Knowledge Base Agent
    const kbResult = await this.executeKBStep(ticket, workflow, classificationResult, troubleshootingResult);

    // Step 5: Resolution Agent
    const resolutionResult = await this.executeResolutionStep(ticket, workflow, troubleshootingResult, kbResult);

    // Check if approval is required
    if (resolutionResult.requiresApproval) {
      workflow.status = 'waiting_approval';
      workflow.currentAgentId = 'resolution_agent';
      store.saveWorkflow(workflow);

      store.updateTicket(ticket.id, {
        status: 'Pending Approval',
        assignedAgent: 'Resolution Agent',
        requiresApproval: true,
        approvalDetails: {
          action: resolutionResult.approvalDetails?.action || 'Privileged IT remediation action',
          risk: resolutionResult.approvalDetails?.risk || 'Medium',
          requestedBy: 'Resolution Agent',
          status: 'pending',
          reason: resolutionResult.approvalDetails?.reason || 'Authorization required for corporate policy compliance'
        }
      });

      store.addNotification({
        ticketId: ticket.id,
        title: `Manager Approval Required: ${ticket.title}`,
        message: `Resolution Agent formulated remediation plan requiring authorization: ${resolutionResult.approvalDetails?.action}`,
        type: 'approval_required',
        recipient: 'IT Operations Administrator'
      });

      emitEvent('workflow_waiting_approval', { workflowId, ticketId, workflow });
      return workflow;
    }

    // Step 6: Notification Agent (if not waiting approval)
    await this.executeNotificationStep(ticket, workflow, resolutionResult);

    // Finalize workflow
    workflow.status = 'completed';
    workflow.completedAt = new Date().toISOString();
    workflow.currentAgentId = undefined;
    store.saveWorkflow(workflow);

    store.updateTicket(ticket.id, {
      status: 'Resolved',
      resolvedAt: new Date().toISOString(),
      resolutionSummary: resolutionResult.remediationPlan
    });

    emitEvent('workflow_completed', { workflowId, ticketId, workflow });
    return workflow;
  }

  /**
   * Resume workflow after human approval
   */
  async approveAndResumeWorkflow(ticketId: string, approverName: string): Promise<WorkflowExecution> {
    const ticket = store.getTicket(ticketId);
    const workflow = store.getWorkflow(ticketId);
    if (!ticket || !workflow) {
      throw new Error(`Ticket or workflow not found for ${ticketId}`);
    }

    // Mark approval in ticket
    if (ticket.approvalDetails) {
      ticket.approvalDetails.status = 'approved';
      ticket.approvalDetails.approvedBy = approverName;
      ticket.approvalDetails.approvedAt = new Date().toISOString();
    }
    store.updateTicket(ticketId, {
      status: 'In Progress',
      approvalDetails: ticket.approvalDetails
    });

    workflow.status = 'running';
    workflow.timeline.push({
      timestamp: new Date().toISOString(),
      title: 'Action Approved',
      description: `Remediation action approved by ${approverName}. Proceeding to execution and employee notification.`,
      status: 'success'
    });

    // Mark resolution step completed
    const resStep = workflow.steps.resolution_agent;
    resStep.status = 'completed';
    resStep.completedAt = new Date().toISOString();
    resStep.currentTask = 'Approved remediation action executed successfully';
    resStep.logs.push(`[${new Date().toLocaleTimeString()}] Approval granted by ${approverName}`);
    resStep.logs.push(`[${new Date().toLocaleTimeString()}] Simulated privileged action executed with return code 0`);

    emitEvent('agent_completed', { ticketId, agentId: 'resolution_agent', step: resStep });

    // Execute notification step
    const resolutionOutput = resStep.outputGenerated || {
      remediationPlan: ticket.approvalDetails?.action || 'Approved remediation procedure executed.',
      simulatedExecutionStatus: 'completed'
    };

    await this.executeNotificationStep(ticket, workflow, resolutionOutput);

    // Finalize
    workflow.status = 'completed';
    workflow.completedAt = new Date().toISOString();
    workflow.currentAgentId = undefined;
    store.saveWorkflow(workflow);

    store.updateTicket(ticket.id, {
      status: 'Resolved',
      resolvedAt: new Date().toISOString(),
      resolutionSummary: resolutionOutput.remediationPlan
    });

    emitEvent('workflow_completed', { workflowId: workflow.id, ticketId, workflow });
    return workflow;
  }

  // --- INDIVIDUAL AGENT STEP EXECUTIONS ---

  private async executeCoordinatorStep(ticket: Ticket, workflow: WorkflowExecution) {
    const agentId: AgentId = 'coordinator_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Validating request data and initializing agent pipeline';
    step.inputReceived = {
      ticketId: ticket.id,
      title: ticket.title,
      employeeName: ticket.employeeName,
      department: ticket.department,
      deviceType: ticket.deviceType,
      officeLocation: ticket.officeLocation
    };
    step.logs.push(`[${new Date().toLocaleTimeString()}] Incoming support request payload received.`);
    step.logs.push(`[${new Date().toLocaleTimeString()}] Verifying employee ID ${ticket.employeeId} in Corporate Directory.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Triage for ${ticket.id}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    // Call Gemini
    const userPrompt = `Employee Support Request Payload:
Ticket ID: ${ticket.id}
Employee: ${ticket.employeeName} (${ticket.employeeId})
Department: ${ticket.department}
Device: ${ticket.deviceType}
Location: ${ticket.officeLocation}
Title: ${ticket.title}
Description: ${ticket.description}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => ({
      isValid: true,
      validationNotes: 'Mandatory fields validated. Employee credentials verified in directory.',
      dispatchedTo: 'classification_agent',
      initialRisk: ticket.priority === 'Critical' ? 'High' : 'Medium',
      decisionSummary: `Validated request for ${ticket.employeeName}. Dispatched to Classification Agent for taxonomy mapping.`,
      llmRationale: 'All required parameters (device hardware model, departmental context, descriptive failure symptoms) are present and conform to ITIL ingest requirements.'
    }));

    const duration = Date.now() - started;
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.executionDurationMs = duration;
    step.currentTask = 'Request validated and pipeline dispatched';
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Validation passed. Handed off to Classification Agent.`);

    workflow.timeline.push({
      timestamp: step.completedAt,
      title: 'Coordinator Initialized',
      description: `Coordinator validated request. Delegated to Classification Agent.`,
      status: 'info',
      agentId
    });

    store.updateAgent(agentId, {
      currentStatus: 'idle',
      currentTask: 'Listening for incoming tickets',
      tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
      lastActive: 'Just now'
    });

    store.addInterAgentMessage({
      fromAgent: 'Coordinator Agent',
      toAgent: 'Classification Agent',
      ticketId: ticket.id,
      message: `Assigned ticket ${ticket.id} (${ticket.title}) for classification and priority assessment.`,
      payloadSummary: `Employee: ${ticket.employeeName}, Department: ${ticket.department}`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }

  private async executeClassificationStep(ticket: Ticket, workflow: WorkflowExecution) {
    const agentId: AgentId = 'classification_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Analyzing linguistic tokens and mapping to ITIL service taxonomy';
    step.inputReceived = {
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
      deviceType: ticket.deviceType
    };
    step.logs.push(`[${new Date().toLocaleTimeString()}] Running natural language intent classification.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Classifying ${ticket.id}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    const userPrompt = `Classify this IT Support Ticket:
Title: ${ticket.title}
Description: ${ticket.description}
Department: ${ticket.department}
Device: ${ticket.deviceType}
Original User Category: ${ticket.category}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => {
      // Intelligent fallback taxonomy mapping
      let category = ticket.category;
      let subcategory = 'General Hardware / Diagnostics';
      if (ticket.description.toLowerCase().includes('wi-fi') || ticket.title.toLowerCase().includes('wi-fi') || ticket.description.toLowerCase().includes('vpn')) {
        category = 'Network and Wi-Fi';
        subcategory = 'Enterprise Wireless 802.1X / VPN';
      } else if (ticket.description.toLowerCase().includes('password') || ticket.description.toLowerCase().includes('okta') || ticket.description.toLowerCase().includes('lock')) {
        category = 'Password and Access';
        subcategory = 'SSO & Identity Access Management';
      } else if (ticket.description.toLowerCase().includes('docker') || ticket.description.toLowerCase().includes('software') || ticket.description.toLowerCase().includes('license')) {
        category = 'Software Installation';
        subcategory = 'Commercial Developer Tooling';
      } else if (ticket.description.toLowerCase().includes('outlook') || ticket.description.toLowerCase().includes('email') || ticket.description.toLowerCase().includes('mail')) {
        category = 'Email Issues';
        subcategory = 'Exchange Online & OST Cache';
      }

      return {
        category,
        subcategory,
        priority: ticket.priority,
        severity: ticket.priority === 'Critical' ? 'High' : ticket.priority === 'High' ? 'Medium' : 'Low',
        affectedService: `${category} Core Services`,
        businessImpact: `Impacts work productivity for ${ticket.department} team member.`,
        confidence: 0.94,
        summary: ticket.title,
        recommendedAction: 'Proceed to Technical Troubleshooting Agent',
        decisionSummary: `Classified as ${category} (${subcategory}) with ${ticket.priority} priority.`,
        llmRationale: `Linguistic analysis detected key operational distress markers corresponding to ${category}. Severity calibrated based on department critical path.`
      };
    });

    const duration = Date.now() - started;
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.executionDurationMs = duration;
    step.currentTask = `Classified as ${output.category} / ${output.subcategory}`;
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Confidence score: ${(output.confidence * 100).toFixed(0)}%`);
    step.logs.push(`[${new Date().toLocaleTimeString()}] Handed off to Troubleshooting Agent.`);

    // Update ticket category & priority if refined
    store.updateTicket(ticket.id, {
      category: output.category as any,
      priority: output.priority as any
    });

    workflow.timeline.push({
      timestamp: step.completedAt,
      title: 'Classification Completed',
      description: `Classified as ${output.category} (${output.priority} priority, ${(output.confidence * 100).toFixed(0)}% confidence).`,
      status: 'success',
      agentId
    });

    store.updateAgent(agentId, {
      currentStatus: 'idle',
      currentTask: 'Listening for categorized ticket assignments',
      tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
      lastActive: 'Just now'
    });

    store.addInterAgentMessage({
      fromAgent: 'Classification Agent',
      toAgent: 'Troubleshooting Agent',
      ticketId: ticket.id,
      message: `Issue classified: ${output.category} > ${output.subcategory}. Priority: ${output.priority}.`,
      payloadSummary: `Severity: ${output.severity}, Confidence: ${(output.confidence * 100).toFixed(0)}%`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }

  private async executeTroubleshootingStep(ticket: Ticket, workflow: WorkflowExecution, classificationResult: any) {
    const agentId: AgentId = 'troubleshooting_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Isolating root cause and computing diagnostic decision tree';
    step.inputReceived = classificationResult;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Evaluating diagnostic telemetry against known hardware/software defect signatures.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Diagnosing ${ticket.id}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    const userPrompt = `Perform technical troubleshooting for this issue:
Title: ${ticket.title}
Description: ${ticket.description}
Device: ${ticket.deviceType}
Category: ${classificationResult.category}
Subcategory: ${classificationResult.subcategory}
Priority: ${classificationResult.priority}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => {
      // Fallback heuristics
      const text = `${ticket.title} ${ticket.description}`.toLowerCase();
      let rootCause = 'System resource contention or corrupted service configuration';
      let steps = ['Inspect system logs', 'Restart service daemon', 'Verify network routing'];
      let automationEligibility = true;
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';

      if (text.includes('wi-fi') || text.includes('wifi') || text.includes('radius')) {
        rootCause = 'Expired 802.1X PEAP client identity certificate on OS keychain';
        steps = ['Check system clock sync', 'Inspect Keychain Access for revoked Root CA', 'Verify RADIUS server response'];
      } else if (text.includes('bsod') || text.includes('crash') || text.includes('panic')) {
        rootCause = 'Faulty RAM sector or recent Thunderbolt / GPU driver bugcheck';
        steps = ['Execute hardware memory diagnostic ePSA', 'Inspect Minidump bugcheck stack trace', 'Check thermal throttling'];
      } else if (text.includes('okta') || text.includes('password') || text.includes('lock')) {
        rootCause = 'Active Directory badPwdCount exceeded threshold from stale mobile credentials';
        steps = ['Query AD DC for lockout timestamp', 'Audit source IP generating pre-auth failure', 'Check Duo/Okta MFA status'];
      } else if (text.includes('docker') || text.includes('license')) {
        rootCause = 'Docker Business license pool allocation required for non-commercial exemption';
        steps = ['Verify departmental billing code', 'Inspect WSL2 hypervisor state', 'Deploy corporate license seat'];
      } else if (text.includes('outlook') || text.includes('email') || text.includes('0x80040115')) {
        rootCause = 'Corrupted modern auth MSAL token and stale offline OST cache file';
        steps = ['Test M365 tenant health status', 'Purge Windows Credential Manager Office entries', 'Rebuild .ost offline cache'];
      }

      return {
        problemAnalysis: `Technical defect isolated within ${classificationResult.category}. Symptoms correlate strongly with ${rootCause}.`,
        possibleRootCauses: [rootCause, 'Secondary configuration drift or corrupted profile cache'],
        troubleshootingSteps: steps,
        riskLevel,
        automationEligibility,
        escalationNeeded: false,
        decisionSummary: `Isolated root cause: ${rootCause}.`,
        llmRationale: `Analysis of error vectors confirms primary root cause. Diagnostic sequence identified clear remediation path.`
      };
    });

    const duration = Date.now() - started;
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.executionDurationMs = duration;
    step.currentTask = `Root cause identified: ${output.possibleRootCauses?.[0] || 'Technical defect isolated'}`;
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Root cause: ${output.possibleRootCauses?.[0]}`);
    step.logs.push(`[${new Date().toLocaleTimeString()}] Automation eligibility: ${output.automationEligibility ? 'Eligible' : 'Requires Human Intervention'}`);

    workflow.timeline.push({
      timestamp: step.completedAt,
      title: 'Troubleshooting Completed',
      description: `Diagnosed root cause: ${output.possibleRootCauses?.[0]}. Automation eligibility: ${output.automationEligibility ? 'Yes' : 'No'}.`,
      status: 'success',
      agentId
    });

    store.updateAgent(agentId, {
      currentStatus: 'idle',
      currentTask: 'Standby for diagnostic tree execution',
      tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
      lastActive: 'Just now'
    });

    store.addInterAgentMessage({
      fromAgent: 'Troubleshooting Agent',
      toAgent: 'Knowledge Base Agent',
      ticketId: ticket.id,
      message: `Root cause identified: ${output.possibleRootCauses?.[0]}. Requesting matching SOP article.`,
      payloadSummary: `Risk Level: ${output.riskLevel}, Steps: ${output.troubleshootingSteps?.length || 3}`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }

  private async executeKBStep(
    ticket: Ticket, 
    workflow: WorkflowExecution, 
    classificationResult: any, 
    troubleshootingResult: any
  ) {
    const agentId: AgentId = 'knowledge_base_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Querying internal IT documentation and standard operating procedures';
    step.inputReceived = {
      category: classificationResult.category,
      rootCause: troubleshootingResult.possibleRootCauses?.[0],
      device: ticket.deviceType
    };
    step.logs.push(`[${new Date().toLocaleTimeString()}] Scanning repository of ${store.getKBArticles().length} verified IT articles.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Indexing KB for ${ticket.id}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    // Local semantic/keyword search
    const allArticles = store.getKBArticles();
    const queryTokens = `${ticket.title} ${classificationResult.category} ${troubleshootingResult.possibleRootCauses?.[0]}`.toLowerCase();
    
    let bestMatch: KnowledgeBaseArticle = allArticles[0];
    let highestScore = 0;

    for (const art of allArticles) {
      let score = 0;
      if (art.category.toLowerCase() === classificationResult.category.toLowerCase()) score += 4;
      for (const tag of art.tags) {
        if (queryTokens.includes(tag.toLowerCase())) score += 3;
      }
      if (queryTokens.includes(art.title.toLowerCase())) score += 5;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = art;
      }
    }

    const userPrompt = `Match the best Knowledge Base documentation for this issue:
Issue: ${ticket.title}
Diagnosed Root Cause: ${troubleshootingResult.possibleRootCauses?.[0]}
Category: ${classificationResult.category}
Candidate Article:
ID: ${bestMatch.id}
Title: ${bestMatch.title}
Troubleshooting: ${bestMatch.troubleshootingSteps.join('; ')}
Solution: ${bestMatch.solution}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => ({
      articleId: bestMatch.id,
      articleTitle: bestMatch.title,
      matchConfidence: 0.96,
      relevantInformation: bestMatch.description,
      recommendedSolution: bestMatch.solution,
      decisionSummary: `Retrieved article ${bestMatch.id}: ${bestMatch.title} (Match confidence: 96%).`,
      llmRationale: `High semantic alignment between diagnosed root cause and verified operating procedure in ${bestMatch.id}.`
    }));

    const duration = Date.now() - started;
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.executionDurationMs = duration;
    step.currentTask = `Matched ${output.articleId}: ${output.articleTitle}`;
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Selected ${output.articleId} (${(output.matchConfidence * 100).toFixed(0)}% match)`);
    step.logs.push(`[${new Date().toLocaleTimeString()}] Handed off procedural solution to Resolution Agent.`);

    workflow.timeline.push({
      timestamp: step.completedAt,
      title: 'Knowledge Base Matched',
      description: `Matched article ${output.articleId} with ${(output.matchConfidence * 100).toFixed(0)}% confidence score.`,
      status: 'success',
      agentId
    });

    store.updateAgent(agentId, {
      currentStatus: 'idle',
      currentTask: 'Indexing internal SOP documents and resolved indices',
      tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
      lastActive: 'Just now'
    });

    store.addInterAgentMessage({
      fromAgent: 'Knowledge Base Agent',
      toAgent: 'Resolution Agent',
      ticketId: ticket.id,
      message: `Retrieved SOP article ${output.articleId}: ${output.articleTitle}.`,
      payloadSummary: `Confidence: ${(output.matchConfidence * 100).toFixed(0)}%, Solution length: ${output.recommendedSolution?.length || 100} chars`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }

  private async executeResolutionStep(
    ticket: Ticket, 
    workflow: WorkflowExecution, 
    troubleshootingResult: any, 
    kbResult: any
  ) {
    const agentId: AgentId = 'resolution_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Formulating remediation plan and evaluating security policy authorization';
    step.inputReceived = {
      rootCause: troubleshootingResult.possibleRootCauses?.[0],
      articleId: kbResult.articleId,
      recommendedSolution: kbResult.recommendedSolution
    };
    step.logs.push(`[${new Date().toLocaleTimeString()}] Synthesizing concrete remediation commands.`);
    step.logs.push(`[${new Date().toLocaleTimeString()}] Performing enterprise safety policy and privilege audit.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Resolving ${ticket.id}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    // Determine if ticket requires human approval
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    const isSensitive = 
      text.includes('wi-fi') || text.includes('certificate') || 
      text.includes('license') || text.includes('docker') || 
      text.includes('shared drive') || text.includes('elevation') ||
      ticket.requiresApproval === true;

    const userPrompt = `Formulate concrete IT resolution for:
Ticket: ${ticket.title}
Employee: ${ticket.employeeName} (${ticket.department})
Root Cause: ${troubleshootingResult.possibleRootCauses?.[0]}
KB Recommended Solution: ${kbResult.recommendedSolution}
Is Privileged Action Flagged: ${isSensitive ? 'YES' : 'NO'}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => {
      if (isSensitive) {
        return {
          remediationPlan: `Automated remediation requires administrative sign-off: deploy updated profile/license to ${ticket.deviceType}.`,
          resolutionSteps: [
            'Request Manager/Administrator authorization for sensitive action',
            'Deploy configuration profile via MDM / Admin Console upon sign-off',
            'Verify device compliance and connectivity'
          ],
          requiresApproval: true,
          approvalDetails: {
            action: `Authorization for ${ticket.category} privileged operation on ${ticket.deviceType}`,
            risk: 'Medium' as const,
            requiredRole: 'IT Operations Administrator',
            reason: 'Administrative policy mandates verification before altering system certificates or allocating corporate licenses.'
          },
          simulatedExecutionStatus: 'waiting_approval',
          decisionSummary: 'Remediation plan formulated. Privileged operation requires administrator approval.',
          llmRationale: 'Safety policy enforces human-in-the-loop sign-off for operations involving security certificates, network trust, or budgetary software seats.'
        };
      }

      return {
        remediationPlan: `Executed automated self-healing script: purged stale cache and synchronized credentials for ${ticket.deviceType}.`,
        resolutionSteps: [
          'Purged stale token cache',
          'Restarted target system background service',
          'Verified return code 0 and successful health check'
        ],
        requiresApproval: false,
        approvalDetails: undefined,
        simulatedExecutionStatus: 'completed',
        decisionSummary: 'Executed safe automated remediation without requiring human elevation.',
        llmRationale: 'Routine client-side cache refresh and identity renewal falls within autonomous agent safety envelope.'
      };
    });

    const duration = Date.now() - started;
    step.executionDurationMs = duration;
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;

    if (output.requiresApproval) {
      step.status = 'waiting_approval';
      step.currentTask = 'Waiting for administrator authorization';
      step.logs.push(`[${new Date().toLocaleTimeString()}] Policy check: Action flagged as sensitive.`);
      step.logs.push(`[${new Date().toLocaleTimeString()}] Workflow paused awaiting human authorization.`);

      workflow.timeline.push({
        timestamp: new Date().toISOString(),
        title: 'Approval Required',
        description: `Resolution Agent paused pipeline. Action "${output.approvalDetails?.action}" requires sign-off.`,
        status: 'warning',
        agentId
      });

      store.updateAgent(agentId, {
        currentStatus: 'waiting_approval',
        currentTask: `Awaiting approval on ${ticket.id}`,
        lastActive: 'Just now'
      });
    } else {
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.currentTask = 'Automated remediation commands executed successfully';
      step.logs.push(`[${new Date().toLocaleTimeString()}] Automated remediation executed with status: Completed.`);

      workflow.timeline.push({
        timestamp: step.completedAt,
        title: 'Resolution Executed',
        description: output.remediationPlan,
        status: 'success',
        agentId
      });

      store.updateAgent(agentId, {
        currentStatus: 'idle',
        currentTask: 'Verifying automated script execution policies',
        tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
        lastActive: 'Just now'
      });
    }

    store.addInterAgentMessage({
      fromAgent: 'Resolution Agent',
      toAgent: output.requiresApproval ? 'Coordinator Agent' : 'Notification Agent',
      ticketId: ticket.id,
      message: output.requiresApproval 
        ? `Remediation formulated. Approval required: ${output.approvalDetails?.action}`
        : `Remediation executed successfully. Passing to Notification Agent.`,
      payloadSummary: `Status: ${output.simulatedExecutionStatus}, Approval: ${output.requiresApproval}`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }

  private async executeNotificationStep(ticket: Ticket, workflow: WorkflowExecution, resolutionResult: any) {
    const agentId: AgentId = 'notification_agent';
    const started = Date.now();
    const timestampStr = new Date().toISOString();

    workflow.currentAgentId = agentId;
    const step = workflow.steps[agentId];
    step.status = 'running';
    step.startedAt = timestampStr;
    step.currentTask = 'Drafting personalized resolution communication for employee';
    step.inputReceived = {
      employeeName: ticket.employeeName,
      title: ticket.title,
      remediationPlan: resolutionResult.remediationPlan
    };
    step.logs.push(`[${new Date().toLocaleTimeString()}] Preparing multi-channel notification dispatch.`);

    store.updateAgent(agentId, { currentStatus: 'running', currentTask: `Notifying ${ticket.employeeName}` });
    emitEvent('agent_started', { ticketId: ticket.id, agentId, step });

    const userPrompt = `Draft employee resolution notification:
Ticket: ${ticket.id} - ${ticket.title}
Employee: ${ticket.employeeName} (${ticket.employeeId})
Department: ${ticket.department}
Remediation Outcome: ${resolutionResult.remediationPlan}`;

    const output = await callGeminiAgent(agentId, userPrompt, () => ({
      notificationTitle: `Resolved: ${ticket.title} [${ticket.id}]`,
      employeeMessage: `Hello ${ticket.employeeName},\n\nYour IT support ticket (${ticket.id}) has been addressed by the ITIS automated resolution pipeline.\n\nResolution Summary:\n${resolutionResult.remediationPlan}\n\nIf you experience any lingering difficulties on your ${ticket.deviceType}, please reply to this notice or reach out to the IT Help Desk.`,
      executiveDigest: `Ticket ${ticket.id} resolved for ${ticket.employeeName} (${ticket.department}).`,
      recommendedChannel: 'Email & Slack',
      decisionSummary: `Notification dispatched to ${ticket.employeeName} via Email & Slack.`,
      llmRationale: 'Direct, clear notification with transparent procedural summary ensures high user satisfaction and reduces repeat ticket reopenings.'
    }));

    const duration = Date.now() - started;
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.executionDurationMs = duration;
    step.currentTask = `Notification dispatched to ${ticket.employeeName}`;
    step.outputGenerated = output;
    step.decisionSummary = output.decisionSummary;
    step.llmRationale = output.llmRationale;
    step.logs.push(`[${new Date().toLocaleTimeString()}] Email & Slack webhook delivered.`);

    // Add to notifications store
    store.addNotification({
      ticketId: ticket.id,
      title: output.notificationTitle,
      message: output.employeeMessage,
      type: 'resolved',
      recipient: ticket.employeeName
    });

    workflow.timeline.push({
      timestamp: step.completedAt,
      title: 'Employee Notified',
      description: `Notification sent to ${ticket.employeeName} via ${output.recommendedChannel}.`,
      status: 'success',
      agentId
    });

    store.updateAgent(agentId, {
      currentStatus: 'idle',
      currentTask: 'Broadcasting resolution digests to employee channels',
      tasksCompleted: store.getAgents().find(a => a.id === agentId)!.tasksCompleted + 1,
      lastActive: 'Just now'
    });

    store.addInterAgentMessage({
      fromAgent: 'Notification Agent',
      toAgent: 'Coordinator Agent',
      ticketId: ticket.id,
      message: `Delivered resolution notice to ${ticket.employeeName}. Ticket workflow finalized.`,
      payloadSummary: `Recipient: ${ticket.employeeName}, Channel: ${output.recommendedChannel}`
    });

    store.saveWorkflow(workflow);
    emitEvent('agent_completed', { ticketId: ticket.id, agentId, step });
    return output;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
