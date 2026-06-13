import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import CrawlerTab from './components/CrawlerTab';
import LeadsTab from './components/LeadsTab';
import CampaignTab from './components/CampaignTab';
import SettingsTab from './components/SettingsTab';
import LoginPage from './components/LoginPage';
import ConfirmDialog from './components/ConfirmDialog';
import AppHeader from './components/layout/AppHeader';
import StatsBar from './components/layout/StatsBar';
import Footer from './components/layout/Footer';
import BackgroundOrbs from './components/layout/BackgroundOrbs';
import NotificationToast from './components/layout/NotificationToast';
import { Lead, SmtpSettings } from './components/types';
import { useAuth } from './contexts/AuthContext';
import { apiFetch } from './lib/api';

export default function App() {
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [leadsVersion, setLeadsVersion] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearLeadsConfirm, setShowClearLeadsConfirm] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({ host: '', port: '', user: '', pass: '' });

  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    const mode = localStorage.getItem('leadcrawler-theme-mode') || 'dark';
    const color = localStorage.getItem('leadcrawler-theme-color') || 'rose';
    document.documentElement.className = '';
    document.documentElement.classList.add(mode);
    if (color !== 'rose') {
      document.documentElement.classList.add(`color-${color}`);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSettings();
    loadSummary();
  }, [user]);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadSummary = async () => {
    try {
      const res = await apiFetch('/api/leads/summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    }
  };

  const triggerLeadsRefresh = () => {
    setLeadsVersion(v => v + 1);
    loadSummary();
  };

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      const data = await res.json();
      setSmtpSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllLeads = async () => {
    try {
      await apiFetch('/api/leads', { method: 'DELETE' });
      showToast('Đã xóa toàn bộ leads thành công.');
      setSelectedLeads([]);
      triggerLeadsRefresh();
    } catch (err) {
      showToast('Không thể xóa leads!', true);
    }
  };

  const handleSelectionChange = (newSelectedIds: Set<string>, currentLeads: Lead[]) => {
    setSelectedLeads(prev => {
      // Filter out deselected leads belonging to the current page
      const deselectedInCurrentPage = currentLeads.filter(l => !newSelectedIds.has(l.id)).map(l => l.id);
      const next = prev.filter(l => !deselectedInCurrentPage.includes(l.id));

      // Add newly selected leads
      currentLeads.forEach(lead => {
        if (newSelectedIds.has(lead.id) && !next.some(l => l.id === lead.id)) {
          next.push(lead);
        }
      });
      return next;
    });
  };

  const selectedIds = new Set(selectedLeads.map(l => l.id));

  // Public login route does not need the dashboard layout / auth check
  if (location.pathname === '/login') {
    return <LoginPage />;
  }

  // Wait for the initial /api/auth/me check before deciding what to render
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Not logged in: redirect to /login, remembering where the user came from
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased relative flex flex-col">

      <BackgroundOrbs />

      {/* Outer Wrapper */}
      <div className="w-full z-10 relative flex-1 flex flex-col">

        <AppHeader
          smtpSettings={smtpSettings}
          username={user.username}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />

        <StatsBar stats={stats} selectedCount={selectedLeads.length} />

        {/* Main Content Area */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/crawler" replace />} />
            <Route
              path="/crawler"
              element={<CrawlerTab onCrawlSuccess={triggerLeadsRefresh} showToast={showToast} />}
            />
            <Route
              path="/leads"
              element={
                <LeadsTab
                  leadsVersion={leadsVersion}
                  leadsCount={stats.total}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  onClearAll={() => setShowClearLeadsConfirm(true)}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/email"
              element={
                <CampaignTab
                  selectedLeads={selectedLeads}
                  onRemoveLead={(id) => setSelectedLeads(prev => prev.filter(l => l.id !== id))}
                  onSelectLeads={setSelectedLeads}
                  smtpSettings={smtpSettings}
                  showToast={showToast}
                  refreshLeads={triggerLeadsRefresh}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsTab
                  smtpSettings={smtpSettings}
                  onSettingsUpdated={setSmtpSettings}
                  showToast={showToast}
                />
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/crawler" replace />} />
          </Routes>
        </main>
      </div>

      <Footer />

      <NotificationToast show={toast.show} message={toast.message} isError={toast.isError} />

      {/* Logout confirmation */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?"
        confirmLabel="Đăng xuất"
        variant="destructive"
        onConfirm={logout}
      />

      {/* Clear all leads confirmation */}
      <ConfirmDialog
        open={showClearLeadsConfirm}
        onOpenChange={setShowClearLeadsConfirm}
        title="Xóa toàn bộ Leads"
        description="Bạn có chắc chắn muốn xóa toàn bộ Leads đã cào được khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác."
        confirmLabel="Xóa tất cả"
        variant="destructive"
        onConfirm={handleClearAllLeads}
      />
    </div>
  );
}
