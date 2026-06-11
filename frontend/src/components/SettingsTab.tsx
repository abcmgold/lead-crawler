import { ShieldCheck, Mail, Key, Server, Hash, UserCheck, Lock } from 'lucide-react';
import { SmtpSettings } from './types';

interface SettingsTabProps {
  smtpSettings: SmtpSettings;
}

export default function SettingsTab({ smtpSettings }: SettingsTabProps) {
  const readOnlyInputClass =
    'bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 font-mono cursor-not-allowed opacity-70';

  return (
    <div className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 max-w-4xl animate-scale-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5.5 h-5.5 text-primary" />
          Cấu Hình SMTP Gửi Mail
        </h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Thông tin máy chủ SMTP được cấu hình trực tiếp trên server (file .env) và chỉ hiển thị để tham khảo.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 w-fit">
          <Lock className="w-3.5 h-3.5" />
          Chỉ xem - Để thay đổi, vui lòng cập nhật biến môi trường trên server.
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-primary" />
              SMTP Host
            </label>
            <input
              type="text"
              className={readOnlyInputClass}
              value={smtpSettings.host || ''}
              readOnly
              disabled
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-primary" />
              SMTP Port
            </label>
            <input
              type="text"
              className={readOnlyInputClass}
              value={smtpSettings.port || ''}
              readOnly
              disabled
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
              className={readOnlyInputClass}
              value={smtpSettings.user || ''}
              readOnly
              disabled
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" />
              Mật khẩu ứng dụng / SMTP Key
            </label>
            <input
              type="password"
              className={readOnlyInputClass}
              value={smtpSettings.pass || ''}
              readOnly
              disabled
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
              className={readOnlyInputClass}
              value={smtpSettings.senderName || ''}
              readOnly
              disabled
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              Email người gửi thực tế (Sender Email)
            </label>
            <input
              type="text"
              className={readOnlyInputClass}
              value={smtpSettings.senderEmail || ''}
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="secure"
            className="w-4.5 h-4.5 accent-primary cursor-not-allowed rounded bg-slate-950/60 border border-white/10 opacity-70"
            checked={smtpSettings.secure || false}
            readOnly
            disabled
          />
          <label htmlFor="secure" className="text-xs font-semibold text-slate-400 select-none">
            Sử dụng SSL/TLS (Bật cho Port 465, tắt cho Port 587 hoặc 25)
          </label>
        </div>
      </div>
    </div>
  );
}
