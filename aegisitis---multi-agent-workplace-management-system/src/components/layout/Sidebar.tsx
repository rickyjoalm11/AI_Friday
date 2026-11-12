import React from 'react';
import { 
  LayoutDashboard, UserPlus, Ticket, GitBranch, 
  Bot, BookOpen, Bell, Settings, Sparkles, ChevronRight 
} from 'lucide-react';

export type TabKey = 
  | 'dashboard' 
  | 'portal' 
  | 'tickets' 
  | 'workflow' 
  | 'agents' 
  | 'kb' 
  | 'notifications' 
  | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  unreadNotificationsCount
}) => {
  const NAV_ITEMS: { key: TabKey; label: string; icon: React.ElementType; badge?: number | string; highlight?: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'portal', label: 'Employee Portal', icon: UserPlus },
    { key: 'tickets', label: 'Tickets', icon: Ticket, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} req` : undefined },
    { key: 'workflow', label: 'Agent Workflow', icon: GitBranch, highlight: true },
    { key: 'agents', label: 'AI Agents', icon: Bot, badge: '6' },
    { key: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none z-20">
      {/* Sidebar Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          ITSM Workplace System
        </div>

        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : item.key === 'tickets' && pendingApprovalsCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Autonomous System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous Mode</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          6 Gemini agents active on event bus. Average incident triage latency &le; 2.1s.
        </p>
      </div>
    </aside>
  );
};
