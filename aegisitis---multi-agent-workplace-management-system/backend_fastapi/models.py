from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Employee(BaseModel):
    id: str
    name: str
    email: str
    department: str
    role: str
    officeLocation: str
    deviceType: str

class TicketCreateRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = "Other"
    priority: Optional[str] = "Medium"
    employeeId: Optional[str] = "EMP-101"
    employeeName: str
    department: Optional[str] = "Engineering"
    deviceType: Optional[str] = "Enterprise Laptop"
    officeLocation: Optional[str] = "Headquarters"

class ApprovalDetails(BaseModel):
    action: str
    risk: str
    requestedBy: str
    status: str
    reason: Optional[str] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None

class Ticket(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    employeeId: str
    employeeName: str
    department: str
    deviceType: str
    officeLocation: str
    assignedAgent: str
    createdAt: str
    updatedAt: str
    resolvedAt: Optional[str] = None
    requiresApproval: Optional[bool] = False
    approvalDetails: Optional[ApprovalDetails] = None
    resolutionSummary: Optional[str] = None
    escalationReason: Optional[str] = None

class AgentStepExecution(BaseModel):
    agentId: str
    agentName: str
    status: str
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    executionDurationMs: Optional[int] = None
    currentTask: str
    inputReceived: Optional[Dict[str, Any]] = None
    outputGenerated: Optional[Dict[str, Any]] = None
    decisionSummary: Optional[str] = None
    llmRationale: Optional[str] = None
    logs: List[str] = Field(default_factory=list)

class WorkflowExecution(BaseModel):
    id: str
    ticketId: str
    status: str
    startedAt: str
    completedAt: Optional[str] = None
    steps: Dict[str, AgentStepExecution]
    currentAgentId: Optional[str] = None
    timeline: List[Dict[str, Any]] = Field(default_factory=list)

class KnowledgeBaseArticle(BaseModel):
    id: str
    title: str
    category: str
    description: str
    troubleshootingSteps: List[str]
    solution: str
    tags: List[str]
    updatedAt: str
    viewsCount: int = 1
