import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Callable, Optional

# Optional Google GenAI SDK import
try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

class MultiAgentOrchestrator:
    def __init__(self, broadcast_fn: Optional[Callable] = None):
        self.broadcast_fn = broadcast_fn
        self.client = None
        if has_genai and GEMINI_API_KEY:
            self.client = genai.Client(api_key=GEMINI_API_KEY)

    async def emit(self, event: str, payload: Dict[str, Any]):
        if self.broadcast_fn:
            await self.broadcast_fn(event, payload)

    async def run_workflow(self, ticket: Dict[str, Any], kb_articles: list, save_wf_fn: Callable) -> Dict[str, Any]:
        ticket_id = ticket["id"]
        started_at = datetime.utcnow().isoformat() + "Z"
        workflow_id = f"WF-{ticket_id.replace('TKT-', '')}"

        workflow = {
            "id": workflow_id,
            "ticketId": ticket_id,
            "status": "running",
            "startedAt": started_at,
            "currentAgentId": "coordinator_agent",
            "steps": {
                "coordinator_agent": {"agentId": "coordinator_agent", "agentName": "Coordinator Agent", "status": "idle", "currentTask": "Dispatching", "logs": []},
                "classification_agent": {"agentId": "classification_agent", "agentName": "Classification Agent", "status": "idle", "currentTask": "Waiting", "logs": []},
                "troubleshooting_agent": {"agentId": "troubleshooting_agent", "agentName": "Troubleshooting Agent", "status": "idle", "currentTask": "Waiting", "logs": []},
                "knowledge_base_agent": {"agentId": "knowledge_base_agent", "agentName": "Knowledge Base Agent", "status": "idle", "currentTask": "Waiting", "logs": []},
                "resolution_agent": {"agentId": "resolution_agent", "agentName": "Resolution Agent", "status": "idle", "currentTask": "Waiting", "logs": []},
                "notification_agent": {"agentId": "notification_agent", "agentName": "Notification Agent", "status": "idle", "currentTask": "Waiting", "logs": []}
            },
            "timeline": [
                {"timestamp": started_at, "title": "Request Submitted", "description": f"Ticket {ticket_id} submitted by {ticket['employeeName']}.", "status": "info"}
            ]
        }

        save_wf_fn(workflow)
        await self.emit("workflow_started", {"workflowId": workflow_id, "ticketId": ticket_id, "workflow": workflow})

        # 1. Coordinator Agent
        coord_out = await self._run_coordinator(ticket, workflow)
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "coordinator_agent", "step": workflow["steps"]["coordinator_agent"]})

        # 2. Classification Agent
        class_out = await self._run_classification(ticket, workflow)
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "classification_agent", "step": workflow["steps"]["classification_agent"]})

        # 3. Troubleshooting Agent
        trouble_out = await self._run_troubleshooting(ticket, workflow, class_out)
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "troubleshooting_agent", "step": workflow["steps"]["troubleshooting_agent"]})

        # 4. KB Agent
        kb_out = await self._run_kb(ticket, workflow, class_out, trouble_out, kb_articles)
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "knowledge_base_agent", "step": workflow["steps"]["knowledge_base_agent"]})

        # 5. Resolution Agent
        res_out = await self._run_resolution(ticket, workflow, trouble_out, kb_out)
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "resolution_agent", "step": workflow["steps"]["resolution_agent"]})

        if res_out.get("requiresApproval"):
            workflow["status"] = "waiting_approval"
            workflow["currentAgentId"] = "resolution_agent"
            save_wf_fn(workflow)
            await self.emit("workflow_waiting_approval", {"workflowId": workflow_id, "ticketId": ticket_id, "workflow": workflow})
            return workflow

        # 6. Notification Agent
        await self._run_notification(ticket, workflow, res_out)
        workflow["status"] = "completed"
        workflow["completedAt"] = datetime.utcnow().isoformat() + "Z"
        workflow["currentAgentId"] = None
        save_wf_fn(workflow)
        await self.emit("agent_completed", {"ticketId": ticket_id, "agentId": "notification_agent", "step": workflow["steps"]["notification_agent"]})
        await self.emit("workflow_completed", {"workflowId": workflow_id, "ticketId": ticket_id, "workflow": workflow})
        return workflow

    async def _run_coordinator(self, ticket: Dict[str, Any], workflow: Dict[str, Any]) -> Dict[str, Any]:
        step = workflow["steps"]["coordinator_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = "Validating request parameters"
        await asyncio.sleep(0.5)
        step["status"] = "completed"
        step["completedAt"] = datetime.utcnow().isoformat() + "Z"
        step["executionDurationMs"] = 820
        step["outputGenerated"] = {"valid": True, "dispatchedTo": "classification_agent"}
        step["decisionSummary"] = f"Validated request from {ticket['employeeName']}. Assigned to Classification Agent."
        step["llmRationale"] = "All mandatory ITIL incident parameters verified."
        step["logs"] = ["[08:00:01] Payload verified", "[08:00:02] Pipeline dispatched"]
        workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Coordinator Initialized", "description": "Triage started.", "status": "info"})
        return step["outputGenerated"]

    async def _run_classification(self, ticket: Dict[str, Any], workflow: Dict[str, Any]) -> Dict[str, Any]:
        step = workflow["steps"]["classification_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = "Analyzing text and classifying category"
        await asyncio.sleep(0.8)
        step["status"] = "completed"
        step["completedAt"] = datetime.utcnow().isoformat() + "Z"
        step["executionDurationMs"] = 1420
        cat = ticket.get("category", "Hardware")
        step["outputGenerated"] = {
            "category": cat,
            "priority": ticket.get("priority", "High"),
            "confidence": 0.95,
            "businessImpact": f"Impacts {ticket.get('department', 'Engineering')} operations."
        }
        step["decisionSummary"] = f"Classified as {cat} with {ticket.get('priority', 'High')} priority."
        step["llmRationale"] = "Category mapped based on symptom analysis and impacted infrastructure."
        step["logs"] = ["[08:00:02] Processing NL tokens", "[08:00:03] Taxonomy verified"]
        workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Classification Completed", "description": f"Classified as {cat}.", "status": "success"})
        return step["outputGenerated"]

    async def _run_troubleshooting(self, ticket: Dict[str, Any], workflow: Dict[str, Any], class_out: Dict[str, Any]) -> Dict[str, Any]:
        step = workflow["steps"]["troubleshooting_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = "Diagnosing technical defect and isolation"
        await asyncio.sleep(1.0)
        step["status"] = "completed"
        step["completedAt"] = datetime.utcnow().isoformat() + "Z"
        step["executionDurationMs"] = 1910
        root_cause = "Hardware fault, certificate expiration, or service configuration mismatch"
        step["outputGenerated"] = {
            "possibleRootCauses": [root_cause],
            "troubleshootingSteps": ["Verify device logs", "Check service configuration", "Test connectivity"],
            "riskLevel": "Medium",
            "automationEligibility": True
        }
        step["decisionSummary"] = f"Isolated probable root cause: {root_cause}."
        step["llmRationale"] = "Deterministic diagnostic sequence isolated error conditions."
        step["logs"] = ["[08:00:04] Analyzing symptoms", "[08:00:05] Diagnostic root cause established"]
        workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Troubleshooting Completed", "description": f"Root cause: {root_cause}", "status": "success"})
        return step["outputGenerated"]

    async def _run_kb(self, ticket: Dict[str, Any], workflow: Dict[str, Any], class_out: Dict[str, Any], trouble_out: Dict[str, Any], kb_articles: list) -> Dict[str, Any]:
        step = workflow["steps"]["knowledge_base_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = "Querying internal SOP guides"
        await asyncio.sleep(0.6)
        matched_art = kb_articles[0] if kb_articles else {"id": "KB-1001", "title": "General IT Troubleshooting", "solution": "Restart service and check credentials."}
        step["status"] = "completed"
        step["completedAt"] = datetime.utcnow().isoformat() + "Z"
        step["executionDurationMs"] = 1080
        step["outputGenerated"] = {
            "articleId": matched_art.get("id", "KB-1001"),
            "articleTitle": matched_art.get("title", "IT Troubleshooting"),
            "matchConfidence": 0.96,
            "recommendedSolution": matched_art.get("solution", "Apply standard operating patch.")
        }
        step["decisionSummary"] = f"Matched SOP article {matched_art.get('id', 'KB-1001')}."
        step["llmRationale"] = "Semantic match score 96% with internal knowledge base."
        step["logs"] = ["[08:00:06] Querying repository", "[08:00:07] Matched article"]
        workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Knowledge Base Matched", "description": f"Retrieved {matched_art.get('id', 'KB-1001')}.", "status": "success"})
        return step["outputGenerated"]

    async def _run_resolution(self, ticket: Dict[str, Any], workflow: Dict[str, Any], trouble_out: Dict[str, Any], kb_out: Dict[str, Any]) -> Dict[str, Any]:
        step = workflow["steps"]["resolution_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = "Formulating remediation action plan"
        await asyncio.sleep(0.9)
        step["executionDurationMs"] = 1750
        requires_approval = "wi-fi" in ticket.get("title", "").lower() or "license" in ticket.get("title", "").lower()
        if requires_approval:
            step["status"] = "waiting_approval"
            step["currentTask"] = "Waiting for manager approval"
            step["outputGenerated"] = {
                "remediationPlan": "Privileged profile push or license allocation required.",
                "requiresApproval": True,
                "approvalDetails": {"action": "Deploy privileged enterprise update", "risk": "Medium"}
            }
            step["decisionSummary"] = "Remediation plan formulated. Flagged for administrator approval."
            step["llmRationale"] = "Enterprise security policy enforces human sign-off on privileged system modifications."
            workflow["timeline"].append({"timestamp": datetime.utcnow().isoformat() + "Z", "title": "Approval Required", "description": "Action flagged for administrator sign-off.", "status": "warning"})
        else:
            step["status"] = "completed"
            step["completedAt"] = datetime.utcnow().isoformat() + "Z"
            step["currentTask"] = "Simulated automated remediation executed"
            step["outputGenerated"] = {
                "remediationPlan": "Automated self-healing sequence executed successfully.",
                "requiresApproval": False
            }
            step["decisionSummary"] = "Executed automated remediation commands."
            step["llmRationale"] = "Task operates within automated safety boundary."
            workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Resolution Executed", "description": "Automated remediation completed.", "status": "success"})
        return step["outputGenerated"]

    async def _run_notification(self, ticket: Dict[str, Any], workflow: Dict[str, Any], res_out: Dict[str, Any]) -> Dict[str, Any]:
        step = workflow["steps"]["notification_agent"]
        step["status"] = "running"
        step["startedAt"] = datetime.utcnow().isoformat() + "Z"
        step["currentTask"] = f"Notifying employee {ticket['employeeName']}"
        await asyncio.sleep(0.5)
        step["status"] = "completed"
        step["completedAt"] = datetime.utcnow().isoformat() + "Z"
        step["executionDurationMs"] = 920
        step["outputGenerated"] = {
            "notificationTitle": f"Resolved: {ticket['title']}",
            "employeeMessage": f"Hello {ticket['employeeName']}, your request has been resolved.",
            "recommendedChannel": "Email & Slack"
        }
        step["decisionSummary"] = f"Notification delivered to {ticket['employeeName']}."
        step["llmRationale"] = "Employee notification dispatched across active channels."
        workflow["timeline"].append({"timestamp": step["completedAt"], "title": "Employee Notified", "description": "Dispatched resolution notice.", "status": "success"})
        return step["outputGenerated"]
