# AegisITIS - FastAPI Backend Service

This directory contains the Python FastAPI backend for the Multi-Agent ITIS Workplace Management System.

## Architecture
- `main.py`: FastAPI server with REST endpoints and WebSocket (`/ws`) event bus for real-time agent updates.
- `agents.py`: Multi-Agent orchestrator running 6 autonomous specialized agents (Coordinator, Classification, Troubleshooting, Knowledge Base, Resolution, Notification) with Google Gemini integration.
- `models.py`: Pydantic data schemas.
- `requirements.txt`: Python package requirements.

## How to Run the FastAPI Backend
1. Create and activate a Python virtual environment:
```bash
cd backend_fastapi
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your Google Gemini API key:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

4. Start the server on port 8000:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## AI Studio Unified Mode
Inside the Google AI Studio container, the application includes a unified Node.js + Express + WebSocket backend in `server.ts` that immediately powers the entire frontend and multi-agent workflow on port 3000 without requiring extra processes.
