import React from 'react';
import { 
  Cpu, Server, Database, Shield, Terminal, 
  Sparkles, CheckCircle2, Code2, Network, ExternalLink 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Architecture & Agent Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Technical specifications, Google Gemini model hyperparameters, and dual Node.js / FastAPI backend integration.
        </p>
      </div>

      {/* Gemini AI Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">
            Google Gemini Autonomous Multi-Agent Engine
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Model</span>
            <span className="font-mono font-bold text-slate-900 text-sm">gemini-3.8-flash</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Low-latency reasoning model optimized for structured JSON multi-turn agent coordination.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Telemetry Header</span>
            <span className="font-mono font-bold text-slate-900 text-sm">aistudio-build</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Passed via <code className="font-mono text-slate-700">httpOptions.headers</code> in @google/genai SDK.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Output Format</span>
            <span className="font-mono font-bold text-slate-900 text-sm">application/json</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Strictly enforced schema payloads for all six agents.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 p-3.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            API keys are maintained strictly on the server via <code className="font-mono font-semibold">process.env.GEMINI_API_KEY</code> and never transmitted to the browser bundle.
          </span>
        </div>
      </div>

      {/* Multi-Agent Execution Pipeline Flow */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-600" />
          Sequential Agent Pipeline Architecture
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">01</span>
            <div>
              <strong className="text-slate-900 font-bold">Coordinator Agent:</strong>
              <p className="text-slate-600 mt-0.5">
                Central workflow dispatcher. Validates employee identity in Corporate Directory, inspects device specifications, instantiates workflow state, and delegates to Classification.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">02</span>
            <div>
              <strong className="text-slate-900 font-bold">Classification Agent:</strong>
              <p className="text-slate-600 mt-0.5">
                Evaluates symptom descriptions using Gemini natural language parsing. Maps into ITIL categories (Hardware, Network, Password/Access, Software, Email, System Performance) and sets priority (Low/Medium/High/Critical).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">03</span>
            <div>
              <strong className="text-slate-900 font-bold">Troubleshooting Agent:</strong>
              <p className="text-slate-600 mt-0.5">
                Performs deep technical root-cause isolation (e.g. Minidump bugcheck stack trace, expired 802.1X certificates, Active Directory badPwdCount), determines automation safety, and flags Tier-3 human intervention if required.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">04</span>
            <div>
              <strong className="text-slate-900 font-bold">Knowledge Base Agent:</strong>
              <p className="text-slate-600 mt-0.5">
                Executes semantic search against 15+ internal Standard Operating Procedures (SOPs). Retrieves matching article IDs and confidence scores to feed actionable remediation steps forward.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">05</span>
            <div>
              <strong className="text-slate-900 font-bold">Resolution Agent & Approval Gateway:</strong>
              <p className="text-slate-600 mt-0.5">
                Synthesizes concrete fix commands. Enforces the enterprise security policy: sensitive actions (root certificate push, budget license allocation, IAM elevation) automatically pause the pipeline and trigger manager sign-off.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-bold text-slate-400">06</span>
            <div>
              <strong className="text-slate-900 font-bold">Notification Agent:</strong>
              <p className="text-slate-600 mt-0.5">
                Generates empathetic, personalized communication for the employee via Email and Slack, accompanied by executive summary digests for IT operations teams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Python FastAPI Backend Codebase Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Python FastAPI Backend Service Codebase
            </h2>
          </div>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200 font-semibold">
            /backend_fastapi
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The project includes a complete standalone Python FastAPI backend located at <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">/backend_fastapi</code>. It features FastAPI REST routes, WebSocket connections for real-time agent events, Pydantic data validation schemas, and Google Gemini multi-agent orchestration.
        </p>

        <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
          <div className="text-slate-400"># To execute the FastAPI service independently:</div>
          <div>cd backend_fastapi</div>
          <div>python3 -m venv venv &amp;&amp; source venv/bin/activate</div>
          <div>pip install -r requirements.txt</div>
          <div>uvicorn main:app --host 0.0.0.0 --port 8000 --reload</div>
        </div>
      </div>
    </div>
  );
};
