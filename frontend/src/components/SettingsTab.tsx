import { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Key, Server, Hash, UserCheck, Save, Loader2, KeyRound } from 'lucide-react';
import { SmtpSettings } from './types';
import { apiFetch } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface SettingsTabProps {
  smtpSettings: SmtpSettings;
  onSettingsUpdated: (settings: SmtpSettings) => void;
  showToast: (message: string, isError?: boolean) => void;
}

const inputClass =
  'bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300';

export default function SettingsTab({ smtpSettings, onSettingsUpdated, showToast }: SettingsTabProps) {
  return (
    <div className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl animate-scale-in max-w-4xl relative overflow-hidden">
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
        </TabsList>

        <TabsContent value="smtp" className="mt-6">
          <SmtpSettingsForm smtpSettings={smtpSettings} onSettingsUpdated={onSettingsUpdated} showToast={showToast} />
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm showToast={showToast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SmtpSettingsForm({ smtpSettings, onSettingsUpdated, showToast }: SettingsTabProps) {
  const [form, setForm] = useState<SmtpSettings>(smtpSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(smtpSettings);
  }, [smtpSettings]);

  const updateField = (field: keyof SmtpSettings, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
            <input
              type="text"
              className={inputClass}
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
            <input
              type="text"
              className={inputClass}
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
            <input
              type="text"
              className={inputClass}
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
            <input
              type="password"
              className={inputClass}
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
            <input
              type="text"
              className={inputClass}
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
            <input
              type="text"
              className={inputClass}
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

        <button
          type="submit"
          className="w-full md:w-auto bg-gradient-to-r from-primary to-pink-600 text-primary-foreground font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.45)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
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
        </button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ showToast }: { showToast: (message: string, isError?: boolean) => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
          Cập nhật mật khẩu cho tài khoản admin hiện tại.
        </p>
      </div>

      <div className="space-y-5 max-w-md">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Mật khẩu hiện tại</label>
          <input
            type="password"
            className={inputClass}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Mật khẩu mới</label>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-gradient-to-r from-primary to-pink-600 text-primary-foreground font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.45)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
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
        </button>
      </div>
    </form>
  );
}
