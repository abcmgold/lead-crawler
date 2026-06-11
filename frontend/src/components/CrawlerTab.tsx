import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Clock, Trash2, Sparkles } from 'lucide-react';
import { HistoryItem } from './types';
import { apiFetch } from '@/lib/api';
import ConfirmDialog from './ConfirmDialog';

interface CrawlerTabProps {
  onCrawlSuccess: () => void;
  showToast: (message: string, isError?: boolean) => void;
}

interface ConsoleLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function CrawlerTab({ onCrawlSuccess, showToast }: CrawlerTabProps) {
  const [keyword, setKeyword] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('Đang quét...');
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const loadHistory = async () => {
    try {
      const res = await apiFetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      showToast('Vui lòng nhập từ khóa trước!', true);
      return;
    }

    setIsCrawling(true);
    setShowProgressCard(true);
    setProgress(10);
    setCrawlStatus('Đang quét...');
    setConsoleLogs([]);

    addLog(`Khởi chạy Google Search với từ khóa/URL: "${keyword}"`, 'info');

    // Simulate progress logs in UI
    let progressVal = 10;
    const progressInterval = setInterval(() => {
      if (progressVal < 85) {
        progressVal += Math.floor(Math.random() * 8) + 2;
        setProgress(progressVal);

        const simulatedSteps = [
          'Đang phân tích các URL trả về từ kết quả tìm kiếm...',
          'Truy cập trang chủ để tìm kiếm thông tin liên hệ...',
          'Quét tìm cấu trúc thẻ Contact/Giới thiệu...',
          'Trích xuất Email và Số điện thoại tiềm năng...',
          'Đang kiểm tra bảo mật và tránh trùng lặp lead...'
        ];
        const randomStep = simulatedSteps[Math.floor(Math.random() * simulatedSteps.length)];
        addLog(randomStep, 'info');
      }
    }, 3000);

    try {
      const res = await apiFetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });

      const data = await res.json();
      clearInterval(progressInterval);

      if (data.success) {
        setProgress(100);
        setCrawlStatus('Hoàn thành');
        addLog('=== KẾT QUẢ CÀO DỮ LIỆU ===', 'success');

        const leadsFound = data.newLeadsCount || 0;
        if (data.results) {
          (data.results as any[]).forEach(site => {
            if (site.status === 'success') {
              addLog(`[THÀNH CÔNG] ${site.title} (${site.url}): tìm thấy ${site.emails?.length || 0} email, ${site.phones?.length || 0} sđt.`, 'success');
            } else {
              addLog(`[KHÔNG CÓ DATA] ${site.url}: ${site.message || 'Không tìm thấy liên hệ'}`, 'warning');
            }
          });
        }

        addLog(`Hoàn thành. Tìm thấy tổng cộng ${leadsFound} lead mới.`, 'success');
        showToast(`Đã cào xong! Tìm thấy ${leadsFound} leads mới.`);
        onCrawlSuccess(); // reload leads list in main state
        loadHistory();
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setCrawlStatus('Lỗi');
      addLog(`LỖI: ${err.message}`, 'error');
      showToast(`Quá trình cào thất bại: ${err.message}`, true);
    } finally {
      setIsCrawling(false);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await apiFetch('/api/history', { method: 'DELETE' });
      const data = await res.json();
      showToast(data.message);
      loadHistory();
    } catch (err) {
      showToast('Lỗi khi xóa lịch sử', true);
    }
  };

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Search Input Box */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-xl transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-primary/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight text-white font-sans">Quét Tìm Khách Hàng Tiềm Năng</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-3xl">
            Nhập từ khóa ngành nghề, vị trí (Ví dụ: <code className="text-primary font-mono">công ty phần mềm hà nội</code>, <code className="text-primary font-mono">nha khoa uy tín tphcm</code>) để tìm kiếm qua Google/DuckDuckGo và tự động thu thập thông tin liên hệ từ trang web của họ.
            Hoặc nhập trực tiếp URL/Tên miền để cào nhanh không cần tìm kiếm.
          </p>
          <form onSubmit={handleCrawl} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-slate-950/40 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-4 text-white text-base placeholder-slate-500 focus:outline-none transition-all duration-300 font-mono"
                placeholder="Nhập từ khóa hoặc domain (ví dụ: audiostory.com)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isCrawling}
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-pink-600 text-primary-foreground font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.45)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base shrink-0 font-sans"
              disabled={isCrawling}
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang quét...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Bắt đầu quét
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Progress Card */}
      {showProgressCard && (
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4 animate-scale-in">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Loader2 className={`w-4 h-4 text-primary ${crawlStatus === 'Đang quét...' ? 'animate-spin' : ''}`} />
              Tiến Trình Cào Dữ Liệu
            </h4>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${crawlStatus === 'Hoàn thành' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                crawlStatus === 'Lỗi' ? 'bg-rose-950/30 text-rose-400 border-rose-500/20' :
                  'bg-primary/20 text-primary border-primary/20 animate-pulse'
              }`}>
              {crawlStatus}
            </span>
          </div>

          <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary via-pink-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Console Output */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-4 h-48 sm:h-64 overflow-y-auto font-mono text-xs text-sky-400 space-y-1.5 scrollbar-thin">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${log.type === 'success' ? 'text-emerald-400 border-emerald-500/40' :
                  log.type === 'error' ? 'text-rose-400 border-rose-500/40' :
                    log.type === 'warning' ? 'text-amber-400 border-amber-500/40' :
                      'text-sky-400 border-sky-500/20'
                }`}>
                <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                {log.message}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}

      {/* History Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Lịch sử quét
          </h3>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearHistoryConfirm(true)}
              className="text-xs text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-medium self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              Xóa lịch sử
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/40 text-slate-400 border-b border-white/5">
              <tr>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4">Từ khóa / URL</th>
                <th className="px-5 py-4">Số URL quét</th>
                <th className="px-5 py-4">Số Leads mới</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500 font-mono">
                    Chưa có lịch sử quét nào.
                  </td>
                </tr>
              ) : (
                [...history].reverse().map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-200">
                      {log.keyword}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {log.urlsCount} URLs
                    </td>
                    <td className="px-5 py-4 text-emerald-400 font-semibold font-mono">
                      +{log.newLeadsCount} Leads
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear history confirmation */}
      <ConfirmDialog
        open={showClearHistoryConfirm}
        onOpenChange={setShowClearHistoryConfirm}
        title="Xóa lịch sử quét"
        description="Bạn có chắc chắn muốn xóa toàn bộ lịch sử quét?"
        confirmLabel="Xóa lịch sử"
        variant="destructive"
        onConfirm={clearHistory}
      />
    </div>
  );
}
