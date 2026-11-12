import React from 'react';
import { 
  Bell, Search, Shield, Calendar, User, 
  Sparkles, CheckCircle2 
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenNotifications, 
  unreadNotificationsCount,
  onSearchChange 
}) => {
  // Format current date: Thursday, Nov 12, 2026
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 shrink-0 z-30">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold tracking-wider text-sm shadow-xs">
          AI
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
            AegisITIS
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block">
            Workplace Multi-Agent
          </span>
        </div>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global search across tickets, articles, agents, and logs..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Zone 3: Actions, Date, Notifications, Profile */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="whitespace-nowrap">{currentDate}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden lg:block" />

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            EL
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Elena Rostova
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              IT Systems Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
