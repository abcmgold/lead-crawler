import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Search, Users, Mail, Settings, CheckCircle2, AlertCircle, Cpu, Database, LogOut, Loader2 } from 'lucide-react';
import CrawlerTab from './components/CrawlerTab';
import LeadsTab from './components/LeadsTab';
import CampaignTab from './components/CampaignTab';
import SettingsTab from './components/SettingsTab';
import LoginPage from './components/LoginPage';
import ConfirmDialog from './components/ConfirmDialog';
import { Lead, SmtpSettings } from './components/types';
import { useAuth } from './contexts/AuthContext';
import { apiFetch } from './lib/api';

export default function App() {
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearLeadsConfirm, setShowClearLeadsConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({ host: '', port: '', user: '', pass: '' });

  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    if (!user) return;
    loadLeads();
    loadSettings();
  }, [user]);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadLeads = async () => {
    try {
      const res = await apiFetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách leads từ backend!', true);
    }
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
      setSelectedIds(new Set());
      loadLeads();
    } catch (err) {
      showToast('Không thể xóa leads!', true);
    }
  };

  const removeSelectedLead = (id: string) => {
    const nextSelected = new Set(selectedIds);
    nextSelected.delete(id);
    setSelectedIds(nextSelected);
  };

  const selectedLeadsDetails = leads.filter(l => selectedIds.has(l.id));

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

  // Tab configurations
  const menuItems = [
    { path: '/crawler', label: 'Tìm kiếm & Cào', icon: Search },
    { path: '/leads', label: 'Danh sách Leads', icon: Users },
    { path: '/email', label: 'Gửi Email Hàng Loạt', icon: Mail },
    { path: '/settings', label: 'Cấu hình SMTP', icon: Settings },
  ] as const;

  const activeNavClass =
    'bg-gradient-to-r from-primary to-pink-600 text-primary-foreground shadow-lg shadow-primary/20';
  const inactiveNavClass =
    'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]';

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans antialiased relative flex flex-col">

      {/* Decorative Blur Background Orbs */}
      <div className="fixed top-[-20%] left-[20%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Outer Wrapper */}
      <div className="w-full z-10 relative flex-1 flex flex-col">

        {/* Top Floating Glass Navigation Header */}
        <header className="w-full max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 shrink-0 sticky top-0 z-50 backdrop-blur-md">
          <div className="glass-panel rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-2xl relative">

            {/* Logo Area */}
            <div className="flex items-center gap-2 sm:gap-3 select-none">
              <Cpu className="w-6 h-6 sm:w-7 sm:h-7 text-primary animate-pulse" />
              <span className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-pink-400 to-purple-400 bg-clip-text text-transparent glow-text font-mono uppercase">
                LeadCrawler
              </span>
            </div>

            {/* Navigation pills in the center */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-xl border border-white/5 relative">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer relative ${isActive ? activeNavClass : inactiveNavClass
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Status indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 font-mono shadow-inner select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SMTP: {smtpSettings.host ? 'OK' : 'CHƯA CẤU HÌNH'}
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title={`Đăng xuất (${user.username})`}
                className="flex items-center justify-center w-9 h-9 shrink-0 bg-slate-950/60 border border-white/10 rounded-xl text-slate-300 hover:text-rose-300 hover:border-rose-500/30 transition-colors duration-300 cursor-pointer select-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex overflow-x-auto gap-2 bg-slate-950/40 p-1.5 mt-3 rounded-xl border border-white/5 scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${isActive ? activeNavClass : inactiveNavClass
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </header>

        {/* Stats Bento Grid Header */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">

          <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-xl text-primary border border-primary/15 shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Tổng số lead cào</p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">{leads.length}</p>
            </div>
          </div>

          <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/15 shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Đang chọn gửi</p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">{selectedIds.size}</p>
            </div>
          </div>

          <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/15 shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Đã gửi thành công</p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">
                {leads.filter(l => l.emailStatus === 'Gửi thành công').length}
              </p>
            </div>
          </div>

          <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/15 shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Gửi thất bại</p>
              <p className="text-lg sm:text-2xl font-mono font-bold text-white mt-0.5">
                {leads.filter(l => l.emailStatus.startsWith('Thất bại')).length}
              </p>
            </div>
          </div>

        </section>

        {/* Main Content Area */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 flex flex-col items-center">
          <Routes>
            <Route path="/" element={<Navigate to="/crawler" replace />} />
            <Route
              path="/crawler"
              element={<CrawlerTab onCrawlSuccess={loadLeads} showToast={showToast} />}
            />
            <Route
              path="/leads"
              element={
                <LeadsTab
                  leads={leads}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onClearAll={() => setShowClearLeadsConfirm(true)}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/email"
              element={
                <CampaignTab
                  selectedLeads={selectedLeadsDetails}
                  onRemoveLead={removeSelectedLead}
                  smtpSettings={smtpSettings}
                  showToast={showToast}
                  refreshLeads={loadLeads}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsTab smtpSettings={smtpSettings} />
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/crawler" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Glass Footer */}
      <footer className="w-full shrink-0 border-t border-white/5 py-5 text-center text-xs tracking-wider text-slate-500 font-semibold font-mono bg-slate-950/20 backdrop-blur-sm z-10 relative">
        LEADCRAWLER AI PLATFORM • POWERED BY DEV-TOOL-TEAM
      </footer>

      {/* Notification Toast */}
      {toast.show && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-8 sm:max-w-sm border rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-50 animate-scale-in bg-slate-950/90 backdrop-blur-md ${toast.isError ? 'border-destructive text-rose-200' : 'border-primary text-pink-200'
          }`}>
          {toast.isError ? (
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-semibold font-sans">{toast.message}</span>
        </div>
      )}

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
