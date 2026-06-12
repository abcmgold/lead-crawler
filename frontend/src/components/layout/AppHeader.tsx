import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Users, Mail, Settings, Cpu, LogOut, Menu, X } from 'lucide-react';
import { SmtpSettings } from '../types';

const menuItems = [
  { path: '/crawler', label: 'Tìm kiếm & Cào', icon: Search },
  { path: '/leads', label: 'Danh sách Leads', icon: Users },
  { path: '/email', label: 'Gửi Email Hàng Loạt', icon: Mail },
  { path: '/settings', label: 'Cài đặt', icon: Settings },
] as const;

const activeNavClass =
  'bg-gradient-to-r from-primary to-primary-to text-primary-foreground shadow-lg shadow-primary/20';
const inactiveNavClass =
  'text-muted-foreground hover:text-foreground hover:bg-secondary/60';

interface AppHeaderProps {
  smtpSettings: SmtpSettings;
  username: string;
  onLogoutClick: () => void;
}

export default function AppHeader({ smtpSettings, username, onLogoutClick }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 shrink-0 fixed top-0 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md">
      <div className="glass-panel rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-2xl relative">

        {/* Logo Area */}
        <div className="flex items-center gap-2 sm:gap-3 select-none">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 shrink-0 bg-secondary/60 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer select-none"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
          <Cpu className="w-6 h-6 sm:w-7 sm:h-7 text-primary animate-pulse" />
          <span className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-to bg-clip-text text-transparent glow-text font-mono uppercase">
            LeadCrawler
          </span>
        </div>

        {/* Navigation pills in the center */}
        <nav className="hidden md:flex items-center gap-1.5 bg-secondary/40 p-1.5 rounded-xl border border-border relative">
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
          <div className="hidden lg:flex items-center gap-2 bg-secondary/60 border border-border px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground font-mono shadow-inner select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SMTP: {smtpSettings.host ? 'OK' : 'CHƯA CẤU HÌNH'}
          </div>
          <button
            onClick={onLogoutClick}
            title={`Đăng xuất (${username})`}
            className="flex items-center justify-center w-9 h-9 shrink-0 bg-secondary/60 border border-border rounded-xl text-muted-foreground hover:text-rose-400 transition-colors duration-300 cursor-pointer select-none"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-md p-3 mt-3 rounded-2xl border border-white/10 shadow-2xl animate-scale-in">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${isActive ? activeNavClass : inactiveNavClass
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}

          {/* Small SMTP Indicator in Mobile Menu */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 font-mono shadow-inner select-none mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SMTP: {smtpSettings.host ? 'OK' : 'CHƯA CẤU HÌNH'}
          </div>
        </nav>
      )}
    </header>
  );
}
