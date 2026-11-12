import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabKey } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeePortalView } from './components/portal/EmployeePortalView';
import { TicketManagementView } from './components/tickets/TicketManagementView';
import { WorkflowView } from './components/workflow/WorkflowView';
import { AgentsMonitoringView } from './components/agents/AgentsMonitoringView';
import { KnowledgeBaseView } from './components/kb/KnowledgeBaseView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { fetchTickets, fetchNotifications, wsBus } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TKT-1002');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const loadCounts = useCallback(async () => {
    try {
      const [tickets, notifs] = await Promise.all([
        fetchTickets(),
        fetchNotifications()
      ]);
      const approvals = tickets.filter(t => t.status === 'Pending Approval').length;
      const unread = notifs.filter(n => !n.read).length;
      setPendingApprovalsCount(approvals);
      setUnreadNotificationsCount(unread);
    } catch (e) {
      console.error('Failed to load counts:', e);
    }
  }, []);

  useEffect(() => {
    loadCounts();

    // Subscribe to WebSocket events
    const unsub = wsBus.subscribe(() => {
      loadCounts();
    });

    return () => unsub();
  }, [loadCounts]);

  const navigateToWorkflow = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('workflow');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar 
        onOpenNotifications={() => setActiveTab('notifications')}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Body: Sidebar + Active View Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Permanent Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToWorkflow={navigateToWorkflow}
              onNavigateToPortal={() => setActiveTab('portal')}
              onNavigateToTickets={() => setActiveTab('tickets')}
            />
          )}

          {activeTab === 'portal' && (
            <EmployeePortalView
              onTicketSubmitted={navigateToWorkflow}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketManagementView
              onOpenWorkflow={navigateToWorkflow}
            />
          )}

          {activeTab === 'workflow' && (
            <WorkflowView
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsMonitoringView />
          )}

          {activeTab === 'kb' && (
            <KnowledgeBaseView />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              onOpenWorkflow={navigateToWorkflow}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}
