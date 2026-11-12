import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, ShieldAlert, 
  Clock, ArrowRight, CheckCheck, Filter 
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, wsBus } from '../../services/api';

interface NotificationsViewProps {
  onOpenWorkflow: (ticketId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onOpenWorkflow }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'approval_required' | 'resolved'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const loadNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifs();

    const unsub = wsBus.subscribe(() => {
      loadNotifs();
    });
    return () => unsub();
  }, [loadNotifs]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'approval_required') return n.type === 'approval_required';
    if (filter === 'resolved') return n.type === 'resolved';
    return true;
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Notification Center & Communication Digest
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-agent dispatches delivered to employees and IT operations managers.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" />
          Mark All Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setFilter('approval_required')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'approval_required' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approval Requests ({notifications.filter(n => n.type === 'approval_required').length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'resolved' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Resolved ({notifications.filter(n => n.type === 'resolved').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No notifications found under this filter.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !item.read ? 'border-blue-300 ring-2 ring-blue-50/50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === 'approval_required' ? 'bg-amber-100 text-amber-700' :
                  item.type === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                  item.type === 'escalated' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {item.type === 'approval_required' ? <ShieldAlert className="w-5 h-5" /> :
                   item.type === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> :
                   item.type === 'escalated' ? <AlertTriangle className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {item.ticketId}
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line max-w-2xl">
                    {item.message}
                  </p>

                  <div className="text-[11px] text-slate-400 mt-2">
                    Recipient: <strong className="text-slate-600">{item.recipient}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {!item.read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Mark Read
                  </button>
                )}

                <button
                  onClick={() => onOpenWorkflow(item.ticketId)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Workflow <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
