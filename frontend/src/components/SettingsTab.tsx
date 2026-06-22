import { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Key, Server, Hash, UserCheck, Save, Loader2, KeyRound, Palette, Check, Eye, EyeOff } from 'lucide-react';
import { SmtpSettings } from './types';
import { apiFetch } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsTabProps {
  smtpSettings: SmtpSettings;
  onSettingsUpdated: (settings: SmtpSettings) => void;
  showToast: (message: string, isError?: boolean) => void;
  forcedPasswordMode?: boolean;
}

export default function SettingsTab({ smtpSettings, onSettingsUpdated, showToast, forcedPasswordMode = false }: SettingsTabProps) {
  if (forcedPasswordMode) {
    return (
      <div className="w-full relative overflow-hidden">
        <ChangePasswordForm showToast={showToast} />
      </div>
    );
  }

  return (
    <div className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl animate-scale-in w-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      <Tabs defaultValue="smtp" className="relative z-10">
        <TabsList>
          <TabsTrigger value="smtp">
            <ShieldCheck className="w-4 h-4" />
            Cấu hình SMTP
          </TabsTrigger>
          <TabsTrigger value="password">
            <KeyRound className="w-4 h-4" />
            Đổi mật khẩu
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="w-4 h-4" />
            Giao diện / Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="mt-6">
          <SmtpSettingsForm smtpSettings={smtpSettings} onSettingsUpdated={onSettingsUpdated} showToast={showToast} />
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm showToast={showToast} />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <ThemeSelectorForm showToast={showToast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SmtpSettingsForm({ smtpSettings, onSettingsUpdated, showToast }: SettingsTabProps) {
  const [form, setForm] = useState<SmtpSettings>({ ...smtpSettings });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({ ...smtpSettings });
  }, [smtpSettings]);

  const updateField = (key: keyof SmtpSettings, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu cấu hình thất bại');
      }

      onSettingsUpdated(data);
      showToast('Đã lưu cấu hình SMTP thành công.');
    } catch (err: any) {
      showToast(`Lưu cấu hình thất bại: ${err.message}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5.5 h-5.5 text-primary" />
          Cấu Hình SMTP Gửi Mail
        </h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Thông tin máy chủ SMTP dùng để gửi email hàng loạt. Thay đổi tại đây sẽ được lưu vào cơ sở dữ liệu và áp dụng ngay.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-primary" />
              SMTP Host
            </label>
            <Input
              type="text"
              className="font-mono"
              placeholder="smtp.gmail.com"
              value={form.host || ''}
              onChange={(e) => updateField('host', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-primary" />
              SMTP Port
            </label>
            <Input
              type="text"
              className="font-mono"
              placeholder="587"
              value={form.port || ''}
              onChange={(e) => updateField('port', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              Email / Username đăng nhập
            </label>
            <Input
              type="text"
              className="font-mono"
              placeholder="user@example.com"
              value={form.user || ''}
              onChange={(e) => updateField('user', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" />
              Mật khẩu ứng dụng / SMTP Key
            </label>
            <Input
              type="password"
              className="font-mono"
              placeholder="********"
              value={form.pass || ''}
              onChange={(e) => updateField('pass', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              Tên người gửi hiển thị (Sender Display Name)
            </label>
            <Input
              type="text"
              className="font-mono"
              placeholder="Công ty ABC"
              value={form.senderName || ''}
              onChange={(e) => updateField('senderName', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              Email người gửi thực tế (Sender Email)
            </label>
            <Input
              type="text"
              className="font-mono"
              placeholder="sender@example.com"
              value={form.senderEmail || ''}
              onChange={(e) => updateField('senderEmail', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="secure"
            className="w-4.5 h-4.5 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10"
            checked={form.secure || false}
            onChange={(e) => updateField('secure', e.target.checked)}
            disabled={isSaving}
          />
          <label htmlFor="secure" className="text-xs font-semibold text-slate-400 select-none cursor-pointer">
            Sử dụng SSL/TLS (Bật cho Port 465, tắt cho Port 587 hoặc 25)
          </label>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="md-xl"
          className="w-full md:w-auto"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              Lưu cấu hình
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ showToast }: { showToast: (message: string, isError?: boolean) => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const { updateUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Vui lòng điền đầy đủ thông tin.', true);
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới và xác nhận không khớp.', true);
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại');
      }

      showToast('Đổi mật khẩu thành công.');
      if (data.user) {
        updateUser(data.user);
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(`Đổi mật khẩu thất bại: ${err.message}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5.5 h-5.5 text-primary" />
          Đổi Mật Khẩu Đăng Nhập
        </h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Cập nhật mật khẩu cho tài khoản hiện tại.
        </p>
      </div>

      <div className="space-y-5 max-w-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Mật khẩu hiện tại</label>
          <div className="relative">
            <Input
              type={showOldPass ? "text" : "password"}
              className="font-mono pr-10"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => setShowOldPass(!showOldPass)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNewPass ? "text" : "password"}
                className="font-mono pr-10"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showConfirmPass ? "text" : "password"}
                className="font-mono pr-10"
                placeholder="Nhập lại mật khẩu mới để xác nhận"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="md-xl"
          className="w-full md:w-auto"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <KeyRound className="w-4.5 h-4.5" />
              Đổi mật khẩu
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ThemeSelectorForm({ showToast }: { showToast: (message: string, isError?: boolean) => void }) {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [themeColor, setThemeColor] = useState<'rose' | 'emerald' | 'blue' | 'amber' | 'violet' | 'mocha'>('rose');

  useEffect(() => {
    const savedMode = (localStorage.getItem('leadcrawler-theme-mode') as 'dark' | 'light') || 'dark';
    const savedColor = (localStorage.getItem('leadcrawler-theme-color') as any) || 'rose';
    setThemeMode(savedMode);
    setThemeColor(savedColor);
  }, []);

  const applyTheme = (mode: 'dark' | 'light', color: string) => {
    document.documentElement.className = '';
    document.documentElement.classList.add(mode);
    if (color !== 'rose') {
      document.documentElement.classList.add(`color-${color}`);
    }
  };

  const handleSelectMode = (mode: 'dark' | 'light') => {
    setThemeMode(mode);
    localStorage.setItem('leadcrawler-theme-mode', mode);
    applyTheme(mode, themeColor);
    showToast(`Đã chuyển sang Chế độ ${mode === 'dark' ? 'Tối' : 'Sáng'} thành công.`);
  };

  const handleSelectColor = (colorId: 'rose' | 'emerald' | 'blue' | 'amber' | 'violet' | 'mocha') => {
    setThemeColor(colorId);
    localStorage.setItem('leadcrawler-theme-color', colorId);
    applyTheme(themeMode, colorId);
    const colorName = colors.find(c => c.id === colorId)?.name;
    showToast(`Đã đổi tông màu chủ đạo sang ${colorName}.`);
  };

  const modes = [
    {
      id: 'dark',
      name: 'Chế độ Tối (Dark Mode)',
      description: 'Giao diện bừng sáng with các hiệu ứng gradient & neon glow sống động.',
      previewClass: 'bg-slate-900 border-slate-800'
    },
    {
      id: 'light',
      name: 'Chế độ Sáng (Light Mode)',
      description: 'Giao diện phẳng tối giản, sạch sẽ, không có màu gradient.',
      previewClass: 'bg-slate-100 border-slate-200'
    }
  ] as const;

  const colors = [
    {
      id: 'rose',
      name: 'Quantum Rose',
      gradientFrom: 'oklch(0.7043 0.2019 332.0212)',
      gradientTo: 'oklch(0.65 0.22 350)',
      description: 'Hồng & Tím rực rỡ'
    },
    {
      id: 'emerald',
      name: 'Emerald Forest',
      gradientFrom: 'oklch(0.75 0.16 150)',
      gradientTo: 'oklch(0.68 0.18 175)',
      description: 'Xanh lá cây & Bạc hà mát mẻ'
    },
    {
      id: 'blue',
      name: 'Midnight Blue',
      gradientFrom: 'oklch(0.68 0.18 240)',
      gradientTo: 'oklch(0.62 0.20 270)',
      description: 'Xanh dương đậm thanh lịch'
    },
    {
      id: 'amber',
      name: 'Amber Gold',
      gradientFrom: 'oklch(0.76 0.15 75)',
      gradientTo: 'oklch(0.68 0.18 45)',
      description: 'Vàng hổ phách & Cam ấm áp'
    },
    {
      id: 'violet',
      name: 'Violet Glow',
      gradientFrom: 'oklch(0.70 0.18 290)',
      gradientTo: 'oklch(0.64 0.21 315)',
      description: 'Tím đậm hoàng gia quý phái'
    },
    {
      id: 'mocha',
      name: 'Mocha Mousse',
      gradientFrom: 'oklch(0.6083 0.0623 44.3588)',
      gradientTo: 'oklch(0.7272 0.0539 52.3320)',
      description: 'Cà phê Mocha sữa & Kem béo ấm cúng'
    }
  ] as const;

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Palette className="w-5.5 h-5.5 text-primary" />
          Tùy Chỉnh Giao Diện Hệ Thống
        </h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Tùy chọn chế độ hiển thị sáng/tối và tông màu chủ đạo cho LeadCrawler. Cài đặt được lưu cục bộ trên thiết bị của bạn.
        </p>
      </div>

      {/* Mode selection section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">1. Chế độ hiển thị</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {modes.map(m => {
            const isSelected = themeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id)}
                className={`p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-pointer select-none text-left ${isSelected
                  ? 'bg-white/[0.06] border border-primary/40 shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
                  : 'bg-slate-950/20 border border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
              >
                {/* Mini Preview Box */}
                <div className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center relative ${m.previewClass}`}>
                  {isSelected && <Check className="w-5 h-5 text-primary font-bold" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-white block">{m.name}</span>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color selection section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">2. Tông màu chủ đạo (Accent Color)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
          {colors.map(c => {
            const isSelected = themeColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectColor(c.id)}
                className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-300 cursor-pointer select-none text-left ${isSelected
                  ? 'bg-white/[0.06] border border-primary/40 shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
                  : 'bg-slate-950/20 border border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
              >
                {/* Color Dot Preview */}
                <div
                  className="w-8 h-8 rounded-full shrink-0 border border-white/10 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: themeMode === 'light'
                      ? c.gradientFrom // Flat solid look on light mode button previews
                      : `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`
                  }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-white block leading-tight">{c.name}</span>
                  <span className="text-[10px] text-slate-500 leading-normal">{c.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
