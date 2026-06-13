import React, { useState, useEffect } from 'react';
import { Send, X, Paperclip, Loader2, PlayCircle, Layers, Plus, Edit, Trash2, FileText, ClipboardList } from 'lucide-react';
import { Lead, SmtpSettings, HistoryItem } from './types';
import { apiFetch } from '@/lib/api';
import RichTextEditor from './RichTextEditor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ConfirmDialog from './ConfirmDialog';
import { CustomSelect } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CampaignTabProps {
  selectedLeads: Lead[];
  onRemoveLead: (id: string) => void;
  onSelectLeads: (leads: Lead[]) => void;
  smtpSettings: SmtpSettings;
  showToast: (message: string, isError?: boolean) => void;
  refreshLeads: () => void;
}

interface FileAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export default function CampaignTab({ selectedLeads, onRemoveLead, onSelectLeads, smtpSettings, showToast, refreshLeads }: CampaignTabProps) {
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

  // Template states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');

  // Crawl logs state
  const [crawlLogs, setCrawlLogs] = useState<HistoryItem[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  useEffect(() => {
    // Tránh re-render làm giật animation transition (250ms) khi vừa vào tab
    const timer = setTimeout(() => {
      loadTemplates();
      loadCrawlLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await apiFetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải mẫu email:', err);
    }
  };

  const loadCrawlLogs = async () => {
    try {
      const res = await apiFetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setCrawlLogs([...data].reverse()); // Newest first
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử cào:', err);
    }
  };

  const handleSelectCrawlLog = async (logId: string) => {
    const log = crawlLogs.find(l => l.id === logId);
    if (!log) return;

    try {
      const res = await apiFetch(`/api/leads?crawlLogId=${logId}`);
      if (!res.ok) throw new Error();
      const matchingLeads = await res.json();

      if (!matchingLeads || matchingLeads.length === 0) {
        showToast('Không tìm thấy lead nào thuộc lần cào này.', true);
        return;
      }

      const nextSelected = [...selectedLeads];
      matchingLeads.forEach((l: any) => {
        if (!nextSelected.some(existing => existing.id === l.id)) {
          nextSelected.push(l);
        }
      });
      onSelectLeads(nextSelected);
      showToast(`Đã thêm ${matchingLeads.length} leads từ lần cào "${log.keyword}"!`);
    } catch (e) {
      showToast('Không thể tải danh sách leads từ lần cào này!', true);
    }
  };

  const handleCreateNewClick = () => {
    setEditingTemplate({ id: '', name: '', subject: '', body: '', createdAt: '' });
    setTplName('');
    setTplSubject('');
    setTplBody('');
  };

  const handleEditClick = (tpl: Template) => {
    setEditingTemplate(tpl);
    setTplName(tpl.name);
    setTplSubject(tpl.subject);
    setTplBody(tpl.body);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim()) {
      showToast('Tên mẫu email không được để trống!', true);
      return;
    }
    setIsSavingTemplate(true);
    try {
      const isNew = !editingTemplate?.id;
      const url = isNew ? '/api/templates' : `/api/templates/${editingTemplate.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tplName,
          subject: tplSubject,
          body: tplBody
        })
      });

      if (res.ok) {
        showToast(isNew ? 'Đã tạo mẫu email mới!' : 'Đã cập nhật mẫu email!');
        setEditingTemplate(null);
        loadTemplates();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi lưu mẫu email');
      }
    } catch (err: any) {
      showToast(`Không thể lưu mẫu email: ${err.message}`, true);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const requestDeleteTemplate = (id: string) => {
    setTemplateIdToDelete(id);
    setShowDeleteTemplateConfirm(true);
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!templateIdToDelete) return;
    try {
      const res = await apiFetch(`/api/templates/${templateIdToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa mẫu email thành công.');
        loadTemplates();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi xóa mẫu email');
      }
    } catch (err: any) {
      showToast(`Không thể xóa mẫu email: ${err.message}`, true);
    } finally {
      setTemplateIdToDelete(null);
      setShowDeleteTemplateConfirm(false);
    }
  };

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
    <div className="w-full space-y-6">
      <Tabs defaultValue="campaign" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campaign">
            <Send className="w-4 h-4" />
            Gửi chiến dịch
          </TabsTrigger>
          <TabsTrigger value="templates">
            <ClipboardList className="w-4 h-4" />
            Quản lý mẫu email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaign" className="animate-scale-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                {/* Quick template selector */}
                <div className="flex flex-col gap-1.5 bg-slate-950/20 border border-white/5 p-4 rounded-xl">
                  <label className="text-xs font-semibold text-slate-400">Chọn mẫu email soạn sẵn (Nhanh)</label>
                  <CustomSelect
                    placeholder={templates.length === 0 ? "Chưa có mẫu email nào soạn sẵn" : "-- Chọn mẫu email --"}
                    triggerClassName="bg-slate-950/60"
                    onValueChange={(val) => {
                      if (val) {
                        const selected = templates.find(t => t.id === val);
                        if (selected) {
                          setSubject(selected.subject);
                          setBody(selected.body);
                          showToast(`Đã áp dụng mẫu: ${selected.name}`);
                        }
                      }
                    }}
                    options={templates.map(t => ({
                      value: t.id,
                      label: `${t.name} (Tiêu đề: ${t.subject || 'Không có'})`
                    }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tiêu đề email</label>
                  <Input
                    type="text"
                    placeholder="Giới thiệu sản phẩm dịch vụ hoặc hợp tác..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-slate-400">Nội dung email</label>
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder="Chào {{Name}},&#10;&#10;Tôi thấy website của bạn tại {{Website}} có dịch vụ rất thú vị..."
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

                {/* Select by crawl batch */}
                <div className="flex flex-col gap-1.5 bg-slate-950/20 border border-white/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Chọn người nhận theo lần cào (Quét)</span>
                    {selectedLeads.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => onSelectLeads([])}
                        className="text-rose-400 hover:text-rose-300 transition-colors h-auto p-0"
                      >
                        Bỏ chọn tất cả ({selectedLeads.length})
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <CustomSelect
                      value={selectedLogId}
                      onValueChange={(val) => setSelectedLogId(val)}
                      placeholder="-- Chọn lần cào để thêm --"
                      className="flex-1"
                      triggerClassName="bg-slate-950/60"
                      options={crawlLogs.map(log => {
                        const dateStr = new Date(log.timestamp).toLocaleString('vi-VN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        });
                        return {
                          value: log.id,
                          label: `${log.keyword} (${dateStr}) — ${log.newLeadsCount} leads`
                        };
                      })}
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="sm-xl"
                      onClick={() => handleSelectCrawlLog(selectedLogId)}
                      disabled={!selectedLogId}
                      className="shrink-0 h-auto"
                    >
                      Thêm vào danh sách
                    </Button>
                  </div>
                </div>

                <SelectedLeadsList
                  selectedLeads={selectedLeads}
                  onRemoveLead={onRemoveLead}
                  isSending={isSending}
                />

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  size="sm-xl"
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
                </Button>
              </form>
            </div>

            {/* Campaign Logs and Console Card */}
            <CampaignLogs
              showProgress={showProgress}
              progress={progress}
              progressText={progressText}
              logs={logs}
            />
          </div>
        </TabsContent>

        <TabsContent value="templates" className="animate-fade-in">
          {editingTemplate ? (
            /* Create / Edit Template Form */
            <div className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {editingTemplate.id ? 'Cập Nhật Mẫu Email' : 'Tạo Mẫu Email Mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Thiết lập template email sẵn để tái sử dụng. Bạn có thể chèn các thẻ động như <code className="text-primary font-mono">{`{{Name}}`}</code>, <code className="text-primary font-mono">{`{{Website}}`}</code>, <code className="text-primary font-mono">{`{{Email}}`}</code>...
                </p>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tên mẫu email (quản lý nội bộ)</label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Mẫu chào hàng đầu tuần, Mẫu follow up..."
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    disabled={isSavingTemplate}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tiêu đề thư gửi khách hàng (Subject)</label>
                  <Input
                    type="text"
                    placeholder="Tiêu đề email mẫu..."
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                    disabled={isSavingTemplate}
                  />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-slate-400">Nội dung email mẫu (Định dạng Rich HTML)</label>
                  <RichTextEditor
                    value={tplBody}
                    onChange={setTplBody}
                    placeholder="Chào {{Name}},..."
                    disabled={isSavingTemplate}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md-xl"
                    className="flex-1 h-auto"
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu mẫu'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md-xl"
                    onClick={handleCancelEdit}
                    className="flex-1 h-auto"
                    disabled={isSavingTemplate}
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* Templates List */
            <div className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Mẫu Email Soạn Sẵn
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Tạo và quản lý các mẫu thư HTML của bạn. Chọn chúng nhanh khi soạn chiến dịch để tiết kiệm thời gian.
                  </p>
                </div>
                <Button
                  onClick={handleCreateNewClick}
                  variant="gradient"
                  size="sm-xl"
                >
                  <Plus className="w-4 h-4" />
                  Tạo mẫu mới
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {templates.length === 0 ? (
                  <div className="col-span-full text-slate-500 py-16 text-center font-mono border border-dashed border-white/10 rounded-2xl bg-slate-950/10">
                    Chưa có mẫu email nào được tạo. Hãy nhấn "Tạo mẫu mới".
                  </div>
                ) : (
                  templates.map(tpl => (
                    <div key={tpl.id} className="bg-slate-950/40 border border-white/5 rounded-xl p-5 hover:border-white/15 hover:bg-slate-950/60 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-white text-sm truncate">{tpl.name}</h4>
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-400 font-mono truncate">Subject: <strong className="text-slate-300">{tpl.subject || '—'}</strong></p>
                          <div
                            className="text-xs text-slate-500 line-clamp-3 font-sans opacity-85 border-l-2 border-white/5 pl-2 mt-1 leading-relaxed overflow-hidden rich-text-editor-content"
                            dangerouslySetInnerHTML={{ __html: tpl.body || '<i>Nội dung trống</i>' }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 border-t border-white/5 pt-3">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleEditClick(tpl)}
                          className="flex-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Sửa mẫu
                        </Button>
                        <Button
                          variant="destructive"
                          size="lg"
                          onClick={() => requestDeleteTemplate(tpl.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete template confirmation */}
      <ConfirmDialog
        open={showDeleteTemplateConfirm}
        onOpenChange={setShowDeleteTemplateConfirm}
        title="Xóa mẫu email"
        description="Bạn có chắc chắn muốn xóa mẫu email này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa mẫu"
        variant="destructive"
        onConfirm={handleConfirmDeleteTemplate}
      />
    </div>
  );
}

// Memoized Subcomponents to prevent re-renders when typing

interface SelectedLeadsListProps {
  selectedLeads: Lead[];
  onRemoveLead: (id: string) => void;
  isSending: boolean;
}

const SelectedLeadsList = React.memo(function SelectedLeadsList({
  selectedLeads,
  onRemoveLead,
  isSending
}: SelectedLeadsListProps) {
  return (
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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemoveLead(lead.id)}
                className="text-rose-400 hover:text-white hover:bg-rose-500/10"
                disabled={isSending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

interface CampaignLogsProps {
  showProgress: boolean;
  progress: number;
  progressText: string;
  logs: string[];
}

const CampaignLogs = React.memo(function CampaignLogs({
  showProgress,
  progress,
  progressText,
  logs
}: CampaignLogsProps) {
  return (
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
                className="h-full bg-gradient-to-r from-primary to-primary-to rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-console-bg border border-console-border rounded-xl p-4 h-[280px] lg:h-[420px] overflow-y-auto font-mono text-xs text-console-text-info space-y-1.5 scrollbar-thin flex-1 font-sans">
          {logs.length === 0 ? (
            <div className="text-console-text-time font-mono py-8 text-center">Chưa khởi tạo chiến dịch gửi email nào.</div>
          ) : (
            <div className="font-mono space-y-1.5">
              {logs.map((log, idx) => {
                let logClass = 'text-console-text-info';
                let borderClass = 'border-console-border-info';
                if (log.includes('[Thành công]')) {
                  logClass = 'text-console-text-success';
                  borderClass = 'border-console-border-success';
                } else if (log.includes('[Thất bại]') || log.includes('[ERROR]')) {
                  logClass = 'text-console-text-error';
                  borderClass = 'border-console-border-error';
                } else if (log.includes('[INFO]')) {
                  logClass = 'text-console-text-time';
                  borderClass = 'border-console-border';
                }

                return (
                  <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${logClass} ${borderClass}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
