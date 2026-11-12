import { Employee, Ticket, KnowledgeBaseArticle, AgentProfile, WorkflowExecution, NotificationItem, InterAgentMessage } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-101', name: 'Sophia Lin', email: 'sophia.lin@enterprise.corp', department: 'Engineering', role: 'Staff Backend Engineer', officeLocation: 'Building A - Floor 4', deviceType: 'MacBook Pro 16" M3 Max' },
  { id: 'EMP-102', name: 'Marcus Vance', email: 'marcus.vance@enterprise.corp', department: 'Finance', role: 'Senior Financial Analyst', officeLocation: 'Building B - Floor 2', deviceType: 'Lenovo ThinkPad X1 Carbon' },
  { id: 'EMP-103', name: 'Elena Rostova', email: 'elena.rostova@enterprise.corp', department: 'Marketing', role: 'Brand & Creative Director', officeLocation: 'Building A - Floor 3', deviceType: 'MacBook Pro 14" M3 Pro' },
  { id: 'EMP-104', name: 'David Kim', email: 'david.kim@enterprise.corp', department: 'Operations', role: 'Supply Chain Operations Lead', officeLocation: 'Building C - Floor 1', deviceType: 'Dell Latitude 7440' },
  { id: 'EMP-105', name: 'Amara Okafor', email: 'amara.okafor@enterprise.corp', department: 'Human Resources', role: 'People Operations Business Partner', officeLocation: 'Building B - Floor 3', deviceType: 'HP Elite Dragonfly G4' },
  { id: 'EMP-106', name: 'Julian Mercer', email: 'julian.mercer@enterprise.corp', department: 'Engineering', role: 'DevOps / Cloud Architect', officeLocation: 'Building A - Floor 5', deviceType: 'MacBook Pro 16" M2 Max' },
  { id: 'EMP-107', name: 'Chloe Dubois', email: 'chloe.dubois@enterprise.corp', department: 'Administration', role: 'Executive Operations Manager', officeLocation: 'Building B - Floor 4', deviceType: 'Surface Laptop Studio 2' },
  { id: 'EMP-108', name: 'Rajesh Patel', email: 'rajesh.patel@enterprise.corp', department: 'Engineering', role: 'Senior Data Scientist', officeLocation: 'Building A - Floor 4', deviceType: 'Precision 7680 Workstation' },
  { id: 'EMP-109', name: 'Hannah Schmidt', email: 'hannah.schmidt@enterprise.corp', department: 'Finance', role: 'Corporate Controller', officeLocation: 'Building B - Floor 2', deviceType: 'ThinkPad T14s Gen 4' },
  { id: 'EMP-110', name: 'Carlos Mendez', email: 'carlos.mendez@enterprise.corp', department: 'Marketing', role: 'Growth Marketing Specialist', officeLocation: 'Building A - Floor 2', deviceType: 'MacBook Air 15" M3' },
  { id: 'EMP-111', name: 'Aisha Al-Mansoor', email: 'aisha.mansoor@enterprise.corp', department: 'Human Resources', role: 'Talent Acquisition Director', officeLocation: 'Building B - Floor 3', deviceType: 'Dell XPS 15 9530' },
  { id: 'EMP-112', name: 'Liam O\'Connor', email: 'liam.oconnor@enterprise.corp', department: 'Operations', role: 'Facilities & Logistics Lead', officeLocation: 'Building C - Floor 2', deviceType: 'Lenovo ThinkPad P1 Gen 6' },
  { id: 'EMP-113', name: 'Zoe Katsaros', email: 'zoe.katsaros@enterprise.corp', department: 'Engineering', role: 'Frontend Staff Engineer', officeLocation: 'Building A - Floor 4', deviceType: 'MacBook Pro 16" M3 Max' },
  { id: 'EMP-114', name: 'Lucas Bennett', email: 'lucas.bennett@enterprise.corp', department: 'Administration', role: 'IT Compliance & Legal Liaison', officeLocation: 'Building B - Floor 4', deviceType: 'Dell Latitude 9440 2-in-1' },
  { id: 'EMP-115', name: 'Maya Thorne', email: 'maya.thorne@enterprise.corp', department: 'Finance', role: 'FP&A Analyst', officeLocation: 'Building B - Floor 2', deviceType: 'HP Spectre x360 14' }
];

export const INITIAL_AGENTS: AgentProfile[] = [
  {
    id: 'coordinator_agent',
    name: 'Coordinator Agent',
    role: 'Central Workflow Orchestrator',
    description: 'Validates request payloads, manages execution pipelines, handles inter-agent handoffs, monitors SLA thresholds, and escalates exceptions.',
    systemInstruction: 'You are the Coordinator Agent for an enterprise IT Service Management system. You act as the central dispatcher. Receive raw employee requests, validate mandatory fields, initialize workflow state, delegate to the Classification Agent, and supervise the pipeline to completion.',
    currentStatus: 'idle',
    currentTask: 'Supervising active ticket queue and event bus',
    tasksCompleted: 142,
    failedTasks: 2,
    averageExecutionTimeMs: 820,
    lastActive: 'Just now',
    iconName: 'Network'
  },
  {
    id: 'classification_agent',
    name: 'Classification Agent',
    role: 'IT Issue Classification Specialist',
    description: 'Evaluates issue urgency, maps requests to ITIL taxonomy categories, identifies impacted enterprise services, and assigns priority scores.',
    systemInstruction: 'You are the Classification Agent. Analyze employee issue text. Determine exact category, subcategory, priority (Low/Medium/High/Critical), severity, affected IT services, business impact, and confidence score. Return strictly valid structured JSON.',
    currentStatus: 'idle',
    currentTask: 'Listening for categorized ticket assignments',
    tasksCompleted: 138,
    failedTasks: 1,
    averageExecutionTimeMs: 1450,
    lastActive: '2 mins ago',
    iconName: 'Tags'
  },
  {
    id: 'troubleshooting_agent',
    name: 'Troubleshooting Agent',
    role: 'Technical Problem Analysis Specialist',
    description: 'Diagnoses underlying technical defects, identifies probable root causes, generates deterministic verification steps, and evaluates automation safety.',
    systemInstruction: 'You are the Troubleshooting Agent. Given classified issue data, perform deep technical diagnosis. Generate probable root causes, step-by-step diagnostic actions, assess system risk, evaluate if the task can be safely automated, and suggest if human Tier-3 escalation is needed.',
    currentStatus: 'idle',
    currentTask: 'Standby for diagnostic tree execution',
    tasksCompleted: 135,
    failedTasks: 3,
    averageExecutionTimeMs: 1920,
    lastActive: '5 mins ago',
    iconName: 'Wrench'
  },
  {
    id: 'knowledge_base_agent',
    name: 'Knowledge Base Agent',
    role: 'Internal IT Documentation Specialist',
    description: 'Performs semantic searches across internal IT manuals, standard operating procedures (SOPs), and historical resolved incident clusters.',
    systemInstruction: 'You are the Knowledge Base Agent. Retrieve the most relevant IT standard operating procedure or KB guide for the diagnosed problem. Return matching article ID, title, procedural guidelines, solution steps, and confidence match score.',
    currentStatus: 'idle',
    currentTask: 'Indexing internal SOP documents and resolved indices',
    tasksCompleted: 131,
    failedTasks: 0,
    averageExecutionTimeMs: 1100,
    lastActive: '3 mins ago',
    iconName: 'BookOpen'
  },
  {
    id: 'resolution_agent',
    name: 'Resolution Agent',
    role: 'IT Remediation & Execution Specialist',
    description: 'Synthesizes diagnostics with verified KB resolutions, executes safe automated commands, or halts for manager approval on sensitive actions.',
    systemInstruction: 'You are the Resolution Agent. Formulate the concrete resolution procedure. If sensitive actions (admin password reset, firewall change, corporate software license grant, privileged daemon restart) are required, flag approval_required: true and designate required approver. Otherwise execute safe remediation.',
    currentStatus: 'idle',
    currentTask: 'Verifying automated script execution policies',
    tasksCompleted: 128,
    failedTasks: 2,
    averageExecutionTimeMs: 1780,
    lastActive: '1 min ago',
    iconName: 'CheckCircle2'
  },
  {
    id: 'notification_agent',
    name: 'Notification Agent',
    role: 'Employee Communication Specialist',
    description: 'Dispatches personalized enterprise communications across email, Slack, and in-app feeds with clear next steps and transparent status updates.',
    systemInstruction: 'You are the Notification Agent. Draft concise, professional, empathetic, and actionable communication for the affected employee. Include ticket status, steps taken, ETA, instructions, or approval requirements in polite enterprise tone.',
    currentStatus: 'idle',
    currentTask: 'Broadcasting resolution digests to employee channels',
    tasksCompleted: 140,
    failedTasks: 0,
    averageExecutionTimeMs: 950,
    lastActive: 'Just now',
    iconName: 'BellRing'
  }
];

export const INITIAL_KB_ARTICLES: KnowledgeBaseArticle[] = [
  {
    id: 'KB-1001',
    title: 'Enterprise Wi-Fi 802.1X Certificate Renewal & Profile Re-enrollment',
    category: 'Network and Wi-Fi',
    description: 'Resolves authentication failures on corp-secure network when client identity certificates expire or PEAP profile credentials become desynchronized.',
    troubleshootingSteps: [
      'Verify Wi-Fi adapter is enabled and 802.11ax/ac is active.',
      'Check system clock drift (deviation > 30s causes Kerberos & RADIUS handshake failure).',
      'Remove cached corporate Wi-Fi profile from network keychain.',
      'Re-install MDM Enterprise Root CA and Client Identity Certificate via Self-Service Portal.'
    ],
    solution: 'Purge existing corp-secure profile. Execute `sudo certutil -purge` or Keychain cleanup. Install current Enterprise Root CA. Reconnect using corporate identity and accept RADIUS certificate thumbprint.',
    tags: ['wifi', 'network', 'certificate', '802.1x', 'radius', 'corp-secure'],
    updatedAt: '2026-10-18',
    viewsCount: 342
  },
  {
    id: 'KB-1002',
    title: 'Kernel Panic / Blue Screen (BSOD) Diagnostic Procedure for Laptops',
    category: 'Hardware',
    description: 'Standard triage for unexpected OS crash dumps, memory fault codes (CRITICAL_PROCESS_DIED, WHEA_UNCORRECTABLE_ERROR), and thermal throttling shutdowns.',
    troubleshootingSteps: [
      'Boot device into diagnostics partition (F12 on Dell, Apple Diagnostics on Mac).',
      'Execute RAM memory integrity check (ePSA / MemTest86).',
      'Inspect crash minidump in `/Library/Logs/DiagnosticReports` or `C:\\Windows\\Minidump`.',
      'Check SSD NVMe SMART health status and temperature thresholds.'
    ],
    solution: 'If hardware diagnostics pass: roll back recent GPU/thunderbolt driver update, reset NVRAM/SMC, and rebuild kernel extension cache. If RAM or SSD hardware fault detected, issue expedited loaner laptop and schedule warranty depot replacement.',
    tags: ['bsod', 'kernel panic', 'hardware', 'crash', 'laptop', 'memory'],
    updatedAt: '2026-10-25',
    viewsCount: 289
  },
  {
    id: 'KB-1003',
    title: 'Corporate Single Sign-On (SSO) Account Lockout & Self-Service Unlock',
    category: 'Password and Access',
    description: 'Resolves Active Directory / Okta account lockouts triggered by successive bad password attempts from stale background cached mobile tokens.',
    troubleshootingSteps: [
      'Check Active Directory badPwdCount and lockoutTime attributes.',
      'Identify offending client IP / device generating failed Kerberos pre-authentications.',
      'Ensure employee mobile email or VPN client is not looping expired cached credentials.',
      'Verify employee identity via Out-of-Band Duo/Okta Push MFA verification.'
    ],
    solution: 'Initiate verified automated unlock via identity connector API. Terminate stale OAuth refresh tokens on disconnected secondary devices. Enforce password sync across Active Directory, Azure AD, and Workday.',
    tags: ['sso', 'okta', 'password', 'lockout', 'active directory', 'mfa'],
    updatedAt: '2026-11-02',
    viewsCount: 512
  },
  {
    id: 'KB-1004',
    title: 'Docker Desktop & Container Engine Privileged Installation on Managed Laptops',
    category: 'Software Installation',
    description: 'Provisioning Docker Desktop, WSL2 virtualization subsystem, and commercial container licensing for engineering team members.',
    troubleshootingSteps: [
      'Verify employee department qualifies for Docker Business license quota.',
      'Check if CPU virtualization (VT-x / AMD-V) is enabled in UEFI firmware.',
      'Verify available disk space (> 25 GB required for container image store).',
      'Inspect EDR / CrowdStrike policies blocking Hyper-V virtual network adapters.'
    ],
    solution: 'Assign corporate Docker license key in Admin Console. Deploy certified Docker Desktop package via Munki / Microsoft Intune. Grant employee non-root membership in `docker-users` local group without granting full workstation administrator rights.',
    tags: ['docker', 'software', 'installation', 'license', 'engineering', 'containers'],
    updatedAt: '2026-10-12',
    viewsCount: 420
  },
  {
    id: 'KB-1005',
    title: 'Exchange Online / Outlook Mailbox Sync Error 0x80040115 & Disconnected State',
    category: 'Email Issues',
    description: 'Resolves Microsoft 365 Exchange Online connectivity drops, OST data file corruption, and modern auth token expiration.',
    troubleshootingSteps: [
      'Verify Microsoft 365 Service Health status for Exchange Online tenant.',
      'Test TCP connection to `outlook.office365.com` over TLS 443.',
      'Check size of offline cache `.ost` file (if > 45 GB, compact or split).',
      'Check if cached Modern Authentication ADAL/MSAL tokens in Credential Manager are corrupt.'
    ],
    solution: 'Clear cached Microsoft Office identities from OS credential store. Rebuild offline Outlook data file (.ost) by renaming old cache to `.ost.bak`. Restart Outlook in safe mode and trigger Autodiscover sync.',
    tags: ['outlook', 'email', 'exchange', 'sync', '0x80040115', 'office365'],
    updatedAt: '2026-11-05',
    viewsCount: 388
  },
  {
    id: 'KB-1006',
    title: 'High CPU Utilization & Memory Pressure Caused by Indexing Daemons',
    category: 'System Performance',
    description: 'Remediates unresponsive system performance, spinning beachballs/freezes caused by runaway spotlight/mdworker or Windows Search indexers.',
    troubleshootingSteps: [
      'Examine Activity Monitor / Task Manager for processes consuming > 90% CPU.',
      'Identify runaway file crawler processes (`mdworker_shared`, `SearchIndexer.exe`).',
      'Check available unified memory / RAM paging swap space.',
      'Inspect thermal throttling stats using hardware telemetry tools.'
    ],
    solution: 'Re-index search catalogs via command line (`mdimport -f` or rebuild Windows Search index). Exclude large transient developer build directories (`node_modules`, `.git`, `target`) from active indexing daemon search scopes.',
    tags: ['performance', 'cpu', 'memory', 'indexing', 'slow', 'freeze'],
    updatedAt: '2026-09-30',
    viewsCount: 275
  },
  {
    id: 'KB-1007',
    title: 'Enterprise VPN (GlobalProtect) Gateway Timeout & Split Tunneling Issues',
    category: 'Network and Wi-Fi',
    description: 'Troubleshoots remote access VPN connectivity failure, handshake timeout, and DNS resolution failures for internal intranet domains.',
    troubleshootingSteps: [
      'Test external ISP MTU size (MTU clamping needed if carrier uses DS-Lite/PPPoE).',
      'Verify VPN client version matches current corporate gateway minimum standard.',
      'Check if local home network IP subnet collides with internal corporate 10.x/172.x subnets.',
      'Inspect route table for corporate split-tunnel CIDR allocations.'
    ],
    solution: 'Update VPN client to version 6.2+. Switch gateway selector to closest geographic POP. Enable automatic UDP/ESP fallback to TLS tunnel over port 443. Flush local DNS cache.',
    tags: ['vpn', 'network', 'globalprotect', 'remote work', 'dns'],
    updatedAt: '2026-10-15',
    viewsCount: 310
  },
  {
    id: 'KB-1008',
    title: 'Secure Print Queue Spooler Stuck & Badge Reader Authentication Error',
    category: 'Other',
    description: 'Troubleshoots Follow-Me print queue failures, paper cut authentication refusal, and corrupted local spooler documents.',
    troubleshootingSteps: [
      'Verify employee RFID badge number matches Active Directory badge attribute.',
      'Check local print spooler service state (`spoolsv.exe` or CUPS daemon).',
      'Inspect print queue for locked corrupted document with zero-byte spool file.',
      'Verify network reachability to corporate print server `prt-srv01.corp`.'
    ],
    solution: 'Stop local print spooler service. Purge pending spool directory files. Restart print spooler. Resynchronize badge RFID mapping via employee self-service badge registration kiosk.',
    tags: ['printer', 'print spooler', 'badge reader', 'papercut', 'hardware'],
    updatedAt: '2026-10-01',
    viewsCount: 164
  },
  {
    id: 'KB-1009',
    title: 'Zoom / Google Meet Peripheral Audio & Camera Driver Permissions',
    category: 'Hardware',
    description: 'Fixes video conferencing device detection failures, microphone muted at system layer, and USB-C hub peripheral dropping.',
    troubleshootingSteps: [
      'Verify OS privacy permissions allow browser/Zoom access to Camera and Microphone.',
      'Check USB-C dock firmware version and power delivery wattage.',
      'Test microphone input levels in system audio settings.',
      'Check if corporate security endpoint DLP agent is blocking external USB video devices.'
    ],
    solution: 'Grant explicit microphone and camera permissions under System Settings > Privacy & Security. Power cycle USB-C docking station and install vendor DisplayLink/Thunderbolt firmware update.',
    tags: ['audio', 'camera', 'zoom', 'hardware', 'dock', 'peripherals'],
    updatedAt: '2026-10-20',
    viewsCount: 228
  },
  {
    id: 'KB-1010',
    title: 'GitHub Enterprise & AWS IAM Identity Center Access Privilege Provisioning',
    category: 'Password and Access',
    description: 'Self-service and approval flow for engineering team members requesting access to internal GitHub repositories and cloud accounts.',
    troubleshootingSteps: [
      'Confirm employee has completed mandatory Security & Compliance Training.',
      'Verify manager endorsement exists for production environment roles.',
      'Validate employee SAML username exists in corporate GitHub Enterprise organization.',
      'Inspect AWS SSO permission set policies for least-privilege compliance.'
    ],
    solution: 'Generate automated approval request to team lead. Upon lead approval, trigger SCIM provisioning job to synchronize GitHub team memberships and assign AWS IAM Identity Center permission sets.',
    tags: ['github', 'aws', 'access', 'permissions', 'engineering', 'iam'],
    updatedAt: '2026-11-08',
    viewsCount: 395
  },
  {
    id: 'KB-1011',
    title: 'Slack Desktop Client White Screen & Cache Corruption Reset',
    category: 'Software Installation',
    description: 'Remediates Slack desktop client failing to render workspace, showing blank white window or crashing on startup.',
    troubleshootingSteps: [
      'Check Slack web client (`app.slack.com`) to isolate whether issue is account or local app.',
      'Verify local GPU hardware acceleration compatibility with Electron framework.',
      'Inspect local application storage cache directory size.',
      'Check if web proxy or TLS inspection certificate was revoked.'
    ],
    solution: 'Execute complete cache reset: In Slack, press Help > Troubleshooting > Clear Cache and Restart. Alternatively delete local Electron cache in `~/Library/Application Support/Slack/Service Worker/CacheStorage` or `%APPDATA%\\Slack`.',
    tags: ['slack', 'electron', 'cache', 'white screen', 'software'],
    updatedAt: '2026-10-09',
    viewsCount: 195
  },
  {
    id: 'KB-1012',
    title: 'External 4K Monitor Flickering & DisplayPort Link Rate Negotiation',
    category: 'Hardware',
    description: 'Addresses external display blackouts, 30Hz refresh rate locks, and USB-C alt-mode negotiation drops.',
    troubleshootingSteps: [
      'Verify certified Thunderbolt 4 / USB4 cable is used (not standard charge-only cable).',
      'Check monitor OSD menu to ensure DisplayPort version is set to 1.4 with DSC enabled.',
      'Test display directly connected to laptop bypass docking station.',
      'Check OS color profile and HDR toggle settings.'
    ],
    solution: 'Reset DisplayPort topology. Replace substandard passive cable with certified 40Gbps active cable. Toggle display refresh rate from 60Hz to 59.94Hz or disable DSC if multi-stream transport exceeds bandwidth.',
    tags: ['monitor', 'display', 'flicker', 'hardware', 'usb-c', 'hdmi'],
    updatedAt: '2026-10-14',
    viewsCount: 254
  },
  {
    id: 'KB-1013',
    title: 'IntelliJ / VS Code High Memory Leak & Language Server Crash',
    category: 'System Performance',
    description: 'Resolves developer IDE stuttering, out-of-memory heap dumps, and language server protocol (LSP) crashes.',
    troubleshootingSteps: [
      'Check IDE memory indicator / JVM heap consumption.',
      'Inspect project workspace root for circular symlinks or runaway file watchers.',
      'Verify third-party plugins compatibility with latest IDE patch.',
      'Review `idea.vmoptions` max heap `-Xmx` parameter.'
    ],
    solution: 'Increase IDE heap allocation from 2048m to 4096m in custom VM options. Invalidate caches and restart IDE. Disable non-essential community plugins.',
    tags: ['ide', 'vscode', 'intellij', 'memory', 'performance', 'developer'],
    updatedAt: '2026-10-29',
    viewsCount: 315
  },
  {
    id: 'KB-1014',
    title: 'Corporate Shared Network Drive / SMB Mount Permission Denied',
    category: 'Password and Access',
    description: 'Fixes missing departmental drive mappings, Kerberos ticket expiration, and file share permission errors.',
    troubleshootingSteps: [
      'Check if employee security groups include the specific departmental drive share ACL.',
      'Inspect Kerberos ticket cache using `klist`.',
      'Test SMB port 445 reachability across network firewall boundary.',
      'Verify drive mount path syntax (`smb://nas01.corp/finance`).'
    ],
    solution: 'Renew Kerberos ticket via `kinit`. Verify Active Directory group replication. Re-mount network share using authenticated Kerberos principal.',
    tags: ['smb', 'nas', 'file share', 'permissions', 'network drive'],
    updatedAt: '2026-10-05',
    viewsCount: 182
  },
  {
    id: 'KB-1015',
    title: 'Mobile Device Management (MDM) Compliance & FileVault Encryption Sync',
    category: 'Other',
    description: 'Addresses device non-compliance warnings in Microsoft Intune / Jamf Pro blocking access to company resources.',
    troubleshootingSteps: [
      'Check if OS version meets minimum required corporate baseline.',
      'Verify FileVault / BitLocker disk encryption is enabled and escrowed to MDM.',
      'Verify corporate security agent (CrowdStrike / Defender) is active.',
      'Check MDM agent check-in timestamp.'
    ],
    solution: 'Force manual MDM check-in via Company Portal / Self Service. Re-escrow encryption recovery key to tenant. Install pending security update and reboot device.',
    tags: ['mdm', 'compliance', 'intune', 'jamf', 'filevault', 'security'],
    updatedAt: '2026-11-01',
    viewsCount: 267
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-1001',
    title: 'Dell XPS 15 frequent BSOD with CRITICAL_PROCESS_DIED',
    description: 'My laptop started crashing every 30 minutes with a blue screen. It displays CRITICAL_PROCESS_DIED code. Happens mostly when running financial models in Excel.',
    category: 'Hardware',
    priority: 'Critical',
    status: 'In Progress',
    employeeId: 'EMP-102',
    employeeName: 'Marcus Vance',
    department: 'Finance',
    deviceType: 'Dell XPS 15 9530',
    officeLocation: 'Building B - Floor 2',
    assignedAgent: 'Troubleshooting Agent',
    createdAt: '2026-11-12T07:15:00Z',
    updatedAt: '2026-11-12T07:45:00Z'
  },
  {
    id: 'TKT-1002',
    title: 'Cannot connect to corp-secure Wi-Fi in West Wing Building A',
    description: 'Wi-Fi keeps dropping connection every 2 minutes or asking for credentials repeatedly on my MacBook Pro. Other colleagues in West Wing have similar issues.',
    category: 'Network and Wi-Fi',
    priority: 'High',
    status: 'Pending Approval',
    employeeId: 'EMP-101',
    employeeName: 'Sophia Lin',
    department: 'Engineering',
    deviceType: 'MacBook Pro 16" M3 Max',
    officeLocation: 'Building A - Floor 4',
    assignedAgent: 'Resolution Agent',
    createdAt: '2026-11-12T06:30:00Z',
    updatedAt: '2026-11-12T07:55:00Z',
    requiresApproval: true,
    approvalDetails: {
      action: 'Re-push enterprise 802.1X Wi-Fi client certificates via Jamf MDM API',
      risk: 'Medium',
      requestedBy: 'Resolution Agent',
      status: 'pending',
      reason: 'Automated deployment of updated root certificate authority profile to employee workstation.'
    }
  },
  {
    id: 'TKT-1003',
    title: 'Okta SSO account locked after multiple password attempts',
    description: 'Locked out of Okta after traveling back from Tokyo. Phone had old corporate password saved and caused successive lockouts. Need access to Jira and Slack urgently.',
    category: 'Password and Access',
    priority: 'High',
    status: 'Resolved',
    employeeId: 'EMP-103',
    employeeName: 'Elena Rostova',
    department: 'Marketing',
    deviceType: 'MacBook Pro 14" M3 Pro',
    officeLocation: 'Building A - Floor 3',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-12T05:10:00Z',
    updatedAt: '2026-11-12T05:22:00Z',
    resolvedAt: '2026-11-12T05:22:00Z',
    resolutionSummary: 'Verified identity via SMS MFA challenge. Reset bad password count in Active Directory and issued temporary one-time unlock token.'
  },
  {
    id: 'TKT-1004',
    title: 'Docker Desktop commercial license installation request',
    description: 'I recently joined the platform team and need Docker Desktop commercial license and WSL2 container environment configured for local microservice debugging.',
    category: 'Software Installation',
    priority: 'Medium',
    status: 'Pending Approval',
    employeeId: 'EMP-108',
    employeeName: 'Rajesh Patel',
    department: 'Engineering',
    deviceType: 'Precision 7680 Workstation',
    officeLocation: 'Building A - Floor 4',
    assignedAgent: 'Resolution Agent',
    createdAt: '2026-11-12T04:45:00Z',
    updatedAt: '2026-11-12T06:15:00Z',
    requiresApproval: true,
    approvalDetails: {
      action: 'Allocate Docker Business Commercial Seat License ($24/mo seat billing)',
      risk: 'Low',
      requestedBy: 'Resolution Agent',
      status: 'pending',
      reason: 'Requires Engineering Manager budget approval for commercial seat allocation.'
    }
  },
  {
    id: 'TKT-1005',
    title: 'Outlook mailbox sync error 0x80040115 and disconnected state',
    description: 'Outlook has shown "Disconnected" for 3 hours. New emails are visible on webmail but desktop client will not sync or send outgoing messages.',
    category: 'Email Issues',
    priority: 'Medium',
    status: 'Resolved',
    employeeId: 'EMP-105',
    employeeName: 'Amara Okafor',
    department: 'Human Resources',
    deviceType: 'HP Elite Dragonfly G4',
    officeLocation: 'Building B - Floor 3',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-11T16:20:00Z',
    updatedAt: '2026-11-11T16:48:00Z',
    resolvedAt: '2026-11-11T16:48:00Z',
    resolutionSummary: 'Cleared corrupted modern auth MSAL tokens from credential vault. Rebuilt OST cache and restored active Exchange sync.'
  },
  {
    id: 'TKT-1006',
    title: 'MacBook Pro fans spinning at max RPM with spotlight indexing hang',
    description: 'System is sluggish and beachballing constantly. Activity monitor shows `mdworker_shared` taking 380% CPU continuously for past two days.',
    category: 'System Performance',
    priority: 'Medium',
    status: 'In Progress',
    employeeId: 'EMP-113',
    employeeName: 'Zoe Katsaros',
    department: 'Engineering',
    deviceType: 'MacBook Pro 16" M3 Max',
    officeLocation: 'Building A - Floor 4',
    assignedAgent: 'Knowledge Base Agent',
    createdAt: '2026-11-11T15:10:00Z',
    updatedAt: '2026-11-12T06:00:00Z'
  },
  {
    id: 'TKT-1007',
    title: 'External Dell 4K monitor flickering continuously over USB-C',
    description: 'Monitor keeps going black for 2 seconds every few minutes. Unplugging and plugging back in temporarily fixes it but flickers return.',
    category: 'Hardware',
    priority: 'Low',
    status: 'Open',
    employeeId: 'EMP-107',
    employeeName: 'Chloe Dubois',
    department: 'Administration',
    deviceType: 'Surface Laptop Studio 2',
    officeLocation: 'Building B - Floor 4',
    assignedAgent: 'Coordinator Agent',
    createdAt: '2026-11-12T08:00:00Z',
    updatedAt: '2026-11-12T08:00:00Z'
  },
  {
    id: 'TKT-1008',
    title: 'GlobalProtect VPN fails handshake with gateway timeout',
    description: 'Working remotely from home today. GlobalProtect stays stuck at "Connecting" and times out after 60 seconds with error 10060.',
    category: 'Network and Wi-Fi',
    priority: 'High',
    status: 'Resolved',
    employeeId: 'EMP-104',
    employeeName: 'David Kim',
    department: 'Operations',
    deviceType: 'Dell Latitude 7440',
    officeLocation: 'Building C - Floor 1',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-11T14:00:00Z',
    updatedAt: '2026-11-11T14:35:00Z',
    resolvedAt: '2026-11-11T14:35:00Z',
    resolutionSummary: 'Switched tunnel mode from UDP to SSL fallback and re-authenticated RADIUS session. VPN successfully connected.'
  },
  {
    id: 'TKT-1009',
    title: 'Cannot access Finance Shared Drive NAS01 after team transfer',
    description: 'I recently transferred from Accounting to Corporate FP&A. I cannot open `\\\\nas01.corp\\fp-analysis`. It says "Access is Denied".',
    category: 'Password and Access',
    priority: 'High',
    status: 'Pending Approval',
    employeeId: 'EMP-115',
    employeeName: 'Maya Thorne',
    department: 'Finance',
    deviceType: 'HP Spectre x360 14',
    officeLocation: 'Building B - Floor 2',
    assignedAgent: 'Resolution Agent',
    createdAt: '2026-11-11T11:20:00Z',
    updatedAt: '2026-11-12T07:10:00Z',
    requiresApproval: true,
    approvalDetails: {
      action: 'Add user to Active Directory security group "SG-FINANCE-FPA-CONFIDENTIAL"',
      risk: 'Medium',
      requestedBy: 'Resolution Agent',
      status: 'pending',
      reason: 'Requires Corporate Controller Hannah Schmidt approval for confidential financial ledger access.'
    }
  },
  {
    id: 'TKT-1010',
    title: 'Building C Floor 2 badge reader not authenticating on Follow-Me printer',
    description: 'Tapping my corporate RFID badge at the HP LaserJet Enterprise printer produces 3 beeps and says "User Unrecognized". Need to print logistics bills of lading.',
    category: 'Other',
    priority: 'Medium',
    status: 'Open',
    employeeId: 'EMP-112',
    employeeName: 'Liam O\'Connor',
    department: 'Operations',
    deviceType: 'Lenovo ThinkPad P1 Gen 6',
    officeLocation: 'Building C - Floor 2',
    assignedAgent: 'Coordinator Agent',
    createdAt: '2026-11-12T07:30:00Z',
    updatedAt: '2026-11-12T07:30:00Z'
  },
  {
    id: 'TKT-1011',
    title: 'AWS Production IAM role access request for Cloud migration deployment',
    description: 'Cloud team requires temporary 4-hour elevation to AWS Production Administrator role to execute Terraform EKS cluster upgrade.',
    category: 'Password and Access',
    priority: 'Critical',
    status: 'Escalated',
    employeeId: 'EMP-106',
    employeeName: 'Julian Mercer',
    department: 'Engineering',
    deviceType: 'MacBook Pro 16" M2 Max',
    officeLocation: 'Building A - Floor 5',
    assignedAgent: 'Coordinator Agent',
    createdAt: '2026-11-11T09:15:00Z',
    updatedAt: '2026-11-11T10:05:00Z',
    escalationReason: 'Production Cloud root privileges cannot be auto-remediated by AI agents. Escalated to Principal Security Engineer on duty.'
  },
  {
    id: 'TKT-1012',
    title: 'Slack client opens to blank white screen after macOS Sequoia update',
    description: 'Ever since applying the latest OS patch, Slack desktop client starts up but displays pure white screen. Restarting does not resolve it.',
    category: 'Software Installation',
    priority: 'Medium',
    status: 'Resolved',
    employeeId: 'EMP-110',
    employeeName: 'Carlos Mendez',
    department: 'Marketing',
    deviceType: 'MacBook Air 15" M3',
    officeLocation: 'Building A - Floor 2',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-11T08:00:00Z',
    updatedAt: '2026-11-11T08:18:00Z',
    resolvedAt: '2026-11-11T08:18:00Z',
    resolutionSummary: 'Automated script cleared GPU shader cache and Electron service worker storage. Slack restarted successfully.'
  },
  {
    id: 'TKT-1013',
    title: 'IntelliJ IDEA throwing OutOfMemoryError during gradle build index',
    description: 'Gradle daemon and IntelliJ freeze with java.lang.OutOfMemoryError: Java heap space when indexing our monorepo.',
    category: 'System Performance',
    priority: 'Medium',
    status: 'In Progress',
    employeeId: 'EMP-101',
    employeeName: 'Sophia Lin',
    department: 'Engineering',
    deviceType: 'MacBook Pro 16" M3 Max',
    officeLocation: 'Building A - Floor 4',
    assignedAgent: 'Troubleshooting Agent',
    createdAt: '2026-11-12T06:50:00Z',
    updatedAt: '2026-11-12T07:20:00Z'
  },
  {
    id: 'TKT-1014',
    title: 'Zoom conference room Polycom microphone not picking up audio',
    description: 'Conference Room B-201 hardware mic is not detected by Zoom Rooms controller. Upcoming all-hands meeting at 11 AM.',
    category: 'Hardware',
    priority: 'High',
    status: 'In Progress',
    employeeId: 'EMP-114',
    employeeName: 'Lucas Bennett',
    department: 'Administration',
    deviceType: 'Dell Latitude 9440 2-in-1',
    officeLocation: 'Building B - Floor 4',
    assignedAgent: 'Troubleshooting Agent',
    createdAt: '2026-11-12T07:40:00Z',
    updatedAt: '2026-11-12T08:05:00Z'
  },
  {
    id: 'TKT-1015',
    title: 'Intune MDM device non-compliance warning received via email',
    description: 'Received automated email stating laptop is non-compliant due to outdated OS build and FileVault recovery key escrow missing.',
    category: 'Other',
    priority: 'Medium',
    status: 'Resolved',
    employeeId: 'EMP-109',
    employeeName: 'Hannah Schmidt',
    department: 'Finance',
    deviceType: 'ThinkPad T14s Gen 4',
    officeLocation: 'Building B - Floor 2',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-10T14:10:00Z',
    updatedAt: '2026-11-10T14:40:00Z',
    resolvedAt: '2026-11-10T14:40:00Z',
    resolutionSummary: 'Initiated background MDM sync, refreshed BitLocker escrow key in Intune portal, and scheduled overnight OS maintenance update.'
  },
  {
    id: 'TKT-1016',
    title: 'Tableau Desktop license key expired for FP&A monthly close',
    description: 'Tableau Desktop says license expired on Nov 10th. Need renewed license key to prepare Board presentation financial models.',
    category: 'Software Installation',
    priority: 'High',
    status: 'Pending Approval',
    employeeId: 'EMP-102',
    employeeName: 'Marcus Vance',
    department: 'Finance',
    deviceType: 'Lenovo ThinkPad X1 Carbon',
    officeLocation: 'Building B - Floor 2',
    assignedAgent: 'Resolution Agent',
    createdAt: '2026-11-11T13:25:00Z',
    updatedAt: '2026-11-12T06:40:00Z',
    requiresApproval: true,
    approvalDetails: {
      action: 'Assign Tableau Creator enterprise seat from pool',
      risk: 'Low',
      requestedBy: 'Resolution Agent',
      status: 'pending',
      reason: 'Requires departmental software expenditure approval.'
    }
  },
  {
    id: 'TKT-1017',
    title: 'Spam phishing email with suspicious invoice PDF targeting Finance',
    description: 'Received email claiming to be from our chief cloud provider with an encrypted PDF attachment requesting wire change.',
    category: 'Email Issues',
    priority: 'Critical',
    status: 'Resolved',
    employeeId: 'EMP-109',
    employeeName: 'Hannah Schmidt',
    department: 'Finance',
    deviceType: 'ThinkPad T14s Gen 4',
    officeLocation: 'Building B - Floor 2',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-10T09:00:00Z',
    updatedAt: '2026-11-10T09:12:00Z',
    resolvedAt: '2026-11-10T09:12:00Z',
    resolutionSummary: 'Confirmed malicious spear-phishing domain. Automated tenant-wide purge of email and blocked sender IP range in Defender for Office 365.'
  },
  {
    id: 'TKT-1018',
    title: 'Wi-Fi slow connection speed in Building B Cafeteria',
    description: 'Download speeds in Cafeteria area are less than 1 Mbps during lunch hour. Video calls stutter and drop.',
    category: 'Network and Wi-Fi',
    priority: 'Low',
    status: 'Closed',
    employeeId: 'EMP-111',
    employeeName: 'Aisha Al-Mansoor',
    department: 'Human Resources',
    deviceType: 'Dell XPS 15 9530',
    officeLocation: 'Building B - Floor 3',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-09T12:30:00Z',
    updatedAt: '2026-11-09T14:00:00Z',
    resolvedAt: '2026-11-09T14:00:00Z',
    resolutionSummary: 'Access point AP-B-CAF-01 was overloaded. Rebalanced radio channel power and enabled 5GHz band steering.'
  },
  {
    id: 'TKT-1019',
    title: 'Logistics thermal label printer paper feed sensor misaligned',
    description: 'Zebra shipping label printer continuously flashes red error LED and skips every alternate thermal sticker.',
    category: 'Hardware',
    priority: 'Medium',
    status: 'In Progress',
    employeeId: 'EMP-104',
    employeeName: 'David Kim',
    department: 'Operations',
    deviceType: 'Dell Latitude 7440',
    officeLocation: 'Building C - Floor 1',
    assignedAgent: 'Troubleshooting Agent',
    createdAt: '2026-11-12T07:10:00Z',
    updatedAt: '2026-11-12T07:50:00Z'
  },
  {
    id: 'TKT-1020',
    title: 'Git push rejected due to accidental secret key detection',
    description: 'Pre-receive hook on GitHub Enterprise rejected commit because an internal staging API key was detected in a config test file.',
    category: 'Password and Access',
    priority: 'High',
    status: 'Resolved',
    employeeId: 'EMP-106',
    employeeName: 'Julian Mercer',
    department: 'Engineering',
    deviceType: 'MacBook Pro 16" M2 Max',
    officeLocation: 'Building A - Floor 5',
    assignedAgent: 'Notification Agent',
    createdAt: '2026-11-10T11:00:00Z',
    updatedAt: '2026-11-10T11:25:00Z',
    resolvedAt: '2026-11-10T11:25:00Z',
    resolutionSummary: 'Guided engineer through git-filter-repo removal of secret and invalidated the leaked staging token in AWS Secrets Manager.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    ticketId: 'TKT-1002',
    title: 'Manager Approval Required: Wi-Fi Certificate Deployment',
    message: 'Resolution Agent has prepared a remediation plan for TKT-1002 requiring administrative certificate deployment authorization.',
    type: 'approval_required',
    createdAt: '2026-11-12T07:55:00Z',
    read: false,
    recipient: 'IT Admin Lead'
  },
  {
    id: 'NOTIF-002',
    ticketId: 'TKT-1004',
    title: 'Seat Allocation Approval: Docker Business',
    message: 'Engineering Lead approval needed to allocate Docker Commercial seat ($24/mo) for Rajesh Patel (TKT-1004).',
    type: 'approval_required',
    createdAt: '2026-11-12T06:15:00Z',
    read: false,
    recipient: 'Engineering Manager'
  },
  {
    id: 'NOTIF-003',
    ticketId: 'TKT-1009',
    title: 'Permission Elevation Approval: Finance Shared Drive',
    message: 'Maya Thorne requested read/write access to confidential FP&A share (TKT-1009). Awaiting Corporate Controller approval.',
    type: 'approval_required',
    createdAt: '2026-11-12T07:10:00Z',
    read: false,
    recipient: 'Hannah Schmidt'
  },
  {
    id: 'NOTIF-004',
    ticketId: 'TKT-1003',
    title: 'Ticket Resolved: Okta Account Unlocked',
    message: 'Your corporate account has been unlocked and stale mobile tokens flushed. You can now log into Slack and Jira.',
    type: 'resolved',
    createdAt: '2026-11-12T05:22:00Z',
    read: true,
    recipient: 'Elena Rostova'
  },
  {
    id: 'NOTIF-005',
    ticketId: 'TKT-1011',
    title: 'Ticket Escalated: AWS Production Root Elevation',
    message: 'TKT-1011 involves sensitive root AWS privileges and has been automatically escalated to Senior Cloud Security Architect.',
    type: 'escalated',
    createdAt: '2026-11-11T10:05:00Z',
    read: true,
    recipient: 'Security On-Call'
  },
  {
    id: 'NOTIF-006',
    ticketId: 'TKT-1001',
    title: 'Diagnostic Underway: Dell XPS Hardware Analysis',
    message: 'Troubleshooting Agent is analyzing crash dump logs and memory dump codes for Marcus Vance.',
    type: 'progress',
    createdAt: '2026-11-12T07:45:00Z',
    read: false,
    recipient: 'Marcus Vance'
  },
  {
    id: 'NOTIF-007',
    ticketId: 'TKT-1005',
    title: 'Ticket Resolved: Outlook Disconnected Error',
    message: 'Modern auth credentials refreshed and OST cache rebuilt. Mailbox sync restored successfully.',
    type: 'resolved',
    createdAt: '2026-11-11T16:48:00Z',
    read: true,
    recipient: 'Amara Okafor'
  },
  {
    id: 'NOTIF-008',
    ticketId: 'TKT-1008',
    title: 'Ticket Resolved: GlobalProtect VPN Gateway Restored',
    message: 'SSL tunnel failover established. David Kim can resume secure internal network access.',
    type: 'resolved',
    createdAt: '2026-11-11T14:35:00Z',
    read: true,
    recipient: 'David Kim'
  },
  {
    id: 'NOTIF-009',
    ticketId: 'TKT-1012',
    title: 'Ticket Resolved: Slack Desktop White Screen',
    message: 'Electron service worker and GPU cache purged. Slack client is functioning properly.',
    type: 'resolved',
    createdAt: '2026-11-11T08:18:00Z',
    read: true,
    recipient: 'Carlos Mendez'
  },
  {
    id: 'NOTIF-010',
    ticketId: 'TKT-1017',
    title: 'Security Alert Resolved: Phishing Domain Purged',
    message: 'Malicious domain blacklisted tenant-wide. No sensitive credentials compromised.',
    type: 'resolved',
    createdAt: '2026-11-10T09:12:00Z',
    read: true,
    recipient: 'Hannah Schmidt'
  }
];

export const INITIAL_INTER_AGENT_MESSAGES: InterAgentMessage[] = [
  {
    id: 'MSG-001',
    timestamp: '2026-11-12T07:54:10Z',
    fromAgent: 'Troubleshooting Agent',
    toAgent: 'Knowledge Base Agent',
    ticketId: 'TKT-1002',
    message: 'Root cause identified as expired 802.1X PEAP client certificate on macOS client.',
    payloadSummary: 'Category: Network, Subcategory: 802.1X Auth Failure, Symptom: RADIUS desync'
  },
  {
    id: 'MSG-002',
    timestamp: '2026-11-12T07:54:35Z',
    fromAgent: 'Knowledge Base Agent',
    toAgent: 'Resolution Agent',
    ticketId: 'TKT-1002',
    message: 'Retrieved matching article KB-1001 with 98% confidence score and certificate remediation steps.',
    payloadSummary: 'Article: KB-1001 Enterprise Wi-Fi 802.1X Certificate Renewal'
  },
  {
    id: 'MSG-003',
    timestamp: '2026-11-12T07:54:55Z',
    fromAgent: 'Resolution Agent',
    toAgent: 'Coordinator Agent',
    ticketId: 'TKT-1002',
    message: 'Remediation plan formulated. MDM certificate push requires administrator approval token.',
    payloadSummary: 'Status: Waiting Approval, Risk: Medium, Action: Push cert profile'
  },
  {
    id: 'MSG-004',
    timestamp: '2026-11-12T07:55:00Z',
    fromAgent: 'Coordinator Agent',
    toAgent: 'Notification Agent',
    ticketId: 'TKT-1002',
    message: 'Dispatch approval request notification to IT operations administrator and notify employee of progress.',
    payloadSummary: 'Notification queue triggered for Sophia Lin and IT Admin'
  }
];

export const DEMO_PRESETS = [
  {
    title: 'Laptop Crash & Kernel Panic',
    employeeId: 'EMP-102',
    category: 'Hardware' as const,
    priority: 'Critical' as const,
    deviceType: 'Dell XPS 15 9530',
    officeLocation: 'Building B - Floor 2',
    issueTitle: 'Dell XPS laptop frequent BSOD with CRITICAL_PROCESS_DIED',
    issueDescription: 'Laptop crashes with blue screen every 30 minutes while executing financial models in Excel. Event Viewer shows bugcheck 0x000000EF. Diagnostic dump attached.'
  },
  {
    title: 'Office Wi-Fi Dropouts',
    employeeId: 'EMP-101',
    category: 'Network and Wi-Fi' as const,
    priority: 'High' as const,
    deviceType: 'MacBook Pro 16" M3 Max',
    officeLocation: 'Building A - Floor 4',
    issueTitle: 'corp-secure Wi-Fi disconnecting and rejecting 802.1X authentication',
    issueDescription: 'Connection drops repeatedly on 5GHz band in Building A 4th floor. System prompts for credentials and fails RADIUS handshake.'
  },
  {
    title: 'Okta SSO Lockout',
    employeeId: 'EMP-103',
    category: 'Password and Access' as const,
    priority: 'High' as const,
    deviceType: 'MacBook Pro 14" M3 Pro',
    officeLocation: 'Building A - Floor 3',
    issueTitle: 'Account locked out in Okta after 5 bad password attempts',
    issueDescription: 'Arrived at the office after travel. Stale cached password on secondary iPad locked corporate Okta account. Unable to access Slack, GitHub or Jira.'
  },
  {
    title: 'Docker Desktop License',
    employeeId: 'EMP-108',
    category: 'Software Installation' as const,
    priority: 'Medium' as const,
    deviceType: 'Precision 7680 Workstation',
    officeLocation: 'Building A - Floor 4',
    issueTitle: 'Requesting Docker Desktop Business seat and WSL2 configuration',
    issueDescription: 'Need commercial Docker Desktop license allocated and installed on workstation for containerized data pipeline testing in Python and PyTorch.'
  },
  {
    title: 'Exchange Sync Disconnected',
    employeeId: 'EMP-105',
    category: 'Email Issues' as const,
    priority: 'Medium' as const,
    deviceType: 'HP Elite Dragonfly G4',
    officeLocation: 'Building B - Floor 3',
    issueTitle: 'Outlook desktop client stuck on Disconnected with error 0x80040115',
    issueDescription: 'Outlook desktop client stopped receiving emails 2 hours ago. Webmail works fine. Status bar displays "Disconnected".'
  }
];
