import React, { useState } from 'react';
import { Send, X, Paperclip, Loader2, PlayCircle, Layers } from 'lucide-react';
import { Lead, SmtpSettings } from './types';
import { apiFetch } from '@/lib/api';

interface CampaignTabProps {
  selectedLeads: Lead[];
  onRemoveLead: (id: string) => void;
  smtpSettings: SmtpSettings;
  showToast: (message: string, isError?: boolean) => void;
  refreshLeads: () => void;
}

interface FileAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export default function CampaignTab({ selectedLeads, onRemoveLead, smtpSettings, showToast, refreshLeads }: CampaignTabProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [customEmailsText, setCustomEmailsText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Progress states
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Chưa có chiến dịch nào được khởi tạo.');
  const [logs, setLogs] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const fileToBase64 = (file: File): Promise<FileAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Content = resultString.split(',')[1];
        resolve({
          filename: file.name,
          content: base64Content,
          contentType: file.type
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const customEmails = customEmailsText
      ? customEmailsText.split(/[,\n]/).map(e => e.trim()).filter(e => e.includes('@'))
      : [];

    if (selectedLeads.length === 0 && customEmails.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 lead hoặc tự nhập email gửi riêng!', true);
      return;
    }

    if (!subject.trim() || !body.trim()) {
      showToast('Tiêu đề và nội dung email không được bỏ trống!', true);
      return;
    }

    if (!smtpSettings.host || !smtpSettings.user) {
      showToast('Vui lòng qua tab "Cấu hình SMTP" để thiết lập cấu hình gửi trước.', true);
      return;
    }

    setIsSending(true);
    setShowProgress(true);
    setProgress(0);
    setProgressText('Đang nạp chiến dịch gửi...');
    setLogs([]);

    const attachments: FileAttachment[] = [];
    if (attachedFiles.length > 0) {
      setLogs(prev => [...prev, `[INFO] Đang tải ${attachedFiles.length} tệp đính kèm vào bộ nhớ...`]);
      for (const file of attachedFiles) {
        try {
          const b64 = await fileToBase64(file);
          attachments.push(b64);
        } catch (err) {
          showToast(`Lỗi khi đọc file ${file.name}`, true);
          setIsSending(false);
          return;
        }
      }
    }

    const total = selectedLeads.length + customEmails.length;
    setProgressText(`Đang kết nối SMTP và gửi ${total} email...`);
    setLogs(prev => [...prev, `[INFO] Khởi chạy chiến dịch. SMTP Server: ${smtpSettings.host}. Gửi đi dưới danh nghĩa: ${smtpSettings.senderEmail || smtpSettings.user}`]);

    try {
      const res = await apiFetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads.map(l => l.id),
          customEmails,
          subject,
          body,
          attachments,
          smtp: smtpSettings
        })
      });

      const data = await res.json();

      if (data.success) {
        setProgress(100);
        setProgressText(`Đã gửi xong. Thành công: ${data.successCount}, Thất bại: ${data.failCount}`);

        // Print individual details
        if (data.details) {
          (data.details as any[]).forEach(item => {
            const timestamp = new Date().toLocaleTimeString();
            const logMsg = item.status === 'Gửi thành công'
              ? `[Thành công] [${timestamp}] Đã chuyển thư đến: ${item.email}`
              : `[Thất bại] [${timestamp}] Gửi đến ${item.email} lỗi: ${item.status}`;
            setLogs(prev => [...prev, logMsg]);
          });
        }

        setLogs(prev => [...prev, `[INFO] Chiến dịch kết thúc. Hoàn tất gửi tới ${total} email.`]);
        showToast('Chiến dịch gửi email hoàn thành!');
        refreshLeads(); // refresh data list
      } else {
        throw new Error(data.error || 'Lỗi gửi mail từ backend');
      }
    } catch (err: any) {
      setProgress(0);
      setProgressText(`Thất bại: ${err.message}`);
      setLogs(prev => [...prev, `[ERROR] Lỗi hệ thống: ${err.message}`]);
      showToast(`Gửi email thất bại: ${err.message}`, true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
      {/* Compose Form */}
      <div className="lg:col-span-7 glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Soạn Thảo Chiến Dịch Email
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Thiết lập mẫu email gửi hàng loạt. Bạn có thể sử dụng các thẻ động: <code className="text-primary font-mono">{`{{Name}}`}</code>, <code className="text-primary font-mono">{`{{Email}}`}</code>, <code className="text-primary font-mono">{`{{Phone}}`}</code>, <code className="text-primary font-mono">{`{{Website}}`}</code>.
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Tiêu đề email</label>
            <input
              type="text"
              className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-slate-600"
              placeholder="Giới thiệu sản phẩm dịch vụ hoặc hợp tác..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Nội dung email (Hỗ trợ HTML)</label>
            <textarea
              rows={8}
              className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 font-mono resize-y placeholder-slate-600"
              placeholder={`Chào {{Name}},\n\nTôi thấy website của bạn tại {{Website}} có dịch vụ rất thú vị...`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Tự nhập thêm Email gửi riêng (Xuống dòng hoặc phẩy để phân tách)</label>
            <textarea
              rows={2}
              className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 font-mono placeholder-slate-600"
              placeholder="khachhang1@gmail.com, khachhang2@yahoo.com"
              value={customEmailsText}
              onChange={(e) => setCustomEmailsText(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-primary" />
              Đính kèm tệp tin
            </label>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 border border-white/10 rounded-xl p-3 bg-slate-950/20 file:bg-slate-900 file:hover:bg-slate-800 file:border-white/5 file:text-slate-200 file:px-4 file:py-1.5 file:rounded-lg file:mr-3 file:font-semibold file:cursor-pointer cursor-pointer transition-all duration-200"
                disabled={isSending}
              />
            </div>
            {attachedFiles.length > 0 && (
              <span className="text-xs text-primary font-medium">
                Đã chọn {attachedFiles.length} tệp đính kèm.
              </span>
            )}
          </div>

          {/* Selected leads list box */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex justify-between">
              <span>Danh sách Leads gửi hàng loạt:</span>
              <span>Số lượng: <strong className="text-primary">{selectedLeads.length}</strong></span>
            </span>
            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-2 text-xs scrollbar-thin">
              {selectedLeads.length === 0 ? (
                <div className="text-slate-500 py-4 text-center font-mono">Chưa chọn email nào. Hãy chọn leads từ tab "Danh sách Leads".</div>
              ) : (
                selectedLeads.map(lead => (
                  <div key={lead.id} className="flex justify-between items-center bg-slate-900/40 border border-white/5 px-3 py-2 rounded-lg hover:border-white/10 transition-colors">
                    <span className="truncate max-w-[85%] text-slate-300">
                      <strong className="text-slate-200">{lead.name || 'Site'}</strong> - <code className="text-primary font-mono">{lead.email}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveLead(lead.id)}
                      className="text-rose-400 hover:text-white p-1 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      disabled={isSending}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-pink-600 text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.45)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang gửi thư...
              </>
            ) : (
              <>
                <Send className="w-4.5 h-4.5" />
                Gửi Email Hàng Loạt
              </>
            )}
          </button>
        </form>
      </div>

      {/* Campaign Logs and Console Card */}
      <div className="lg:col-span-5 glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col justify-between space-y-6">
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Kết Quả Gửi Thư
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Theo dõi kết quả gửi email theo thời gian thực từ SMTP Server.
            </p>
          </div>

          {showProgress && (
            <div className="space-y-2 bg-slate-950/40 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 truncate max-w-[70%] font-medium">{progressText}</span>
                <span className="text-primary font-bold font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-900/60 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-4 h-[280px] lg:h-[420px] overflow-y-auto font-mono text-xs text-sky-400 space-y-1.5 scrollbar-thin flex-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 font-mono py-8 text-center">Chưa khởi tạo chiến dịch gửi email nào.</div>
            ) : (
              logs.map((log, idx) => {
                let logClass = 'text-sky-400';
                let borderClass = 'border-sky-500/20';
                if (log.includes('[Thành công]')) {
                  logClass = 'text-emerald-400';
                  borderClass = 'border-emerald-500/40';
                } else if (log.includes('[Thất bại]') || log.includes('[ERROR]')) {
                  logClass = 'text-rose-400';
                  borderClass = 'border-rose-500/40';
                } else if (log.includes('[INFO]')) {
                  logClass = 'text-slate-400';
                  borderClass = 'border-white/5';
                }

                return (
                  <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${logClass} ${borderClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
