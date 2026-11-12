import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import TicketCreateRequest, Ticket, WorkflowExecution
from agents import MultiAgentOrchestrator

app = FastAPI(title="AegisITIS Multi-Agent ITSM Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
active_connections: Set[WebSocket] = set()

async def broadcast_ws(event: str, payload: dict):
    message = json.dumps({"event": event, "payload": payload})
    disconnected = set()
    for ws in active_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        active_connections.remove(ws)

orchestrator = MultiAgentOrchestrator(broadcast_fn=broadcast_ws)

# In-memory storage with file backup
DATA_FILE = os.path.join(os.path.dirname(__file__), "fastapi_store.json")

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback to shared data file if present
    shared_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "store.json"))
    if os.path.exists(shared_path):
        try:
            with open(shared_path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"tickets": [], "workflows": {}, "agents": [], "kbArticles": [], "notifications": [], "employees": []}

store_data = load_data()

def save_data():
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(store_data, f, indent=2)
    except Exception as e:
        print("Error saving data:", e)

def save_workflow_record(wf: dict):
    store_data["workflows"][wf["ticketId"]] = wf
    save_data()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        await websocket.send_text(json.dumps({
            "event": "connected",
            "payload": {"message": "Connected to FastAPI Multi-Agent WebSocket Bus"}
        }))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "backend": "Python FastAPI",
        "active_ws_clients": len(active_connections),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/metrics")
def get_metrics():
    tickets = store_data.get("tickets", [])
    total = len(tickets)
    active = len([t for t in tickets if t.get("status") in ["Open", "In Progress", "Pending Approval"]])
    resolved = len([t for t in tickets if t.get("status") in ["Resolved", "Closed"]])
    pending_appr = len([t for t in tickets if t.get("status") == "Pending Approval"])
    high_pri = len([t for t in tickets if t.get("priority") in ["High", "Critical"]])

    return {
        "totalTickets": total,
        "activeTickets": active,
        "resolvedTickets": resolved,
        "pendingApprovalTickets": pending_appr,
        "highPriorityTickets": high_pri,
        "activeAgents": 6,
        "resolutionRatePercent": int((resolved / total * 100)) if total > 0 else 0,
        "averageResolutionMinutes": 18,
        "ticketsByCategory": [],
        "ticketsByPriority": [],
        "ticketTrends": [],
        "agentPerformance": []
    }

@app.get("/api/tickets")
def list_tickets(status: Optional[str] = None, category: Optional[str] = None, priority: Optional[str] = None, search: Optional[str] = None):
    res = store_data.get("tickets", [])
    if status and status != "All":
        res = [t for t in res if t.get("status", "").lower() == status.lower()]
    if category and category != "All":
        res = [t for t in res if t.get("category", "").lower() == category.lower()]
    if priority and priority != "All":
        res = [t for t in res if t.get("priority", "").lower() == priority.lower()]
    if search:
        q = search.lower()
        res = [t for t in res if q in t.get("title", "").lower() or q in t.get("id", "").lower()]
    return res

@app.post("/api/tickets")
async def create_ticket(req: TicketCreateRequest):
    tickets = store_data.setdefault("tickets", [])
    new_id = f"TKT-{len(tickets) + 1001}"
    now = datetime.utcnow().isoformat() + "Z"

    ticket = {
        "id": new_id,
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "priority": req.priority,
        "status": "In Progress",
        "employeeId": req.employeeId,
        "employeeName": req.employeeName,
        "department": req.department,
        "deviceType": req.deviceType,
        "officeLocation": req.officeLocation,
        "assignedAgent": "Coordinator Agent",
        "createdAt": now,
        "updatedAt": now
    }
    tickets.insert(0, ticket)
    save_data()

    # Trigger background agent workflow
    asyncio.create_task(orchestrator.run_workflow(ticket, store_data.get("kbArticles", []), save_workflow_record))
    return ticket

@app.get("/api/workflows/{ticket_id}")
def get_workflow(ticket_id: str):
    wf = store_data.get("workflows", {}).get(ticket_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@app.get("/api/agents")
def get_agents():
    return store_data.get("agents", [])

@app.get("/api/kb")
def get_kb():
    return store_data.get("kbArticles", [])
