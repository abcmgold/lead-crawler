import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Clock, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { HistoryItem, Lead } from './types';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import ConfirmDialog from './ConfirmDialog';
import CrawlLeadsModal from './CrawlLeadsModal';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';

interface CrawlerTabProps {
  onCrawlSuccess: () => void;
  showToast: (message: string, isError?: boolean) => void;
  leads: Lead[];
}

interface ConsoleLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function CrawlerTab({ onCrawlSuccess, showToast, leads }: CrawlerTabProps) {
  const [keyword, setKeyword] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyPageSize = 10;
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('Đang quét...');
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Leads details modal states
  const [selectedCrawlLog, setSelectedCrawlLog] = useState<HistoryItem | null>(null);
  const [showLogLeadsModal, setShowLogLeadsModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);

  const [modalLeads, setModalLeads] = useState<Lead[]>([]);
  const [modalTotalCount, setModalTotalCount] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  const modalPageSize = 10;

  useEffect(() => {
    if (!selectedCrawlLog) {
      setModalLeads([]);
      setModalTotalCount(0);
      return;
    }

    const fetchModalLeads = async () => {
      setModalLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(modalCurrentPage),
          limit: String(modalPageSize),
          crawlLogId: selectedCrawlLog.id
        });
        const res = await apiFetch(`/api/leads?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setModalLeads(data.leads || []);
          setModalTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Lỗi khi tải leads của phiên cào:', err);
      } finally {
        setModalLoading(false);
      }
    };

    fetchModalLeads();
  }, [selectedCrawlLog, modalCurrentPage]);

  useEffect(() => {
    setModalCurrentPage(1);
  }, [selectedCrawlLog]);

  const modalTotalPages = Math.max(1, Math.ceil(modalTotalCount / modalPageSize));
  const safeModalPage = Math.min(modalCurrentPage, modalTotalPages);

  const goToModalPage = (page: number) => {
    if (page >= 1 && page <= modalTotalPages) setModalCurrentPage(page);
  };

  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory(historyPage);
  }, [historyPage]);

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    setConsoleLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/history?page=${page}&limit=${historyPageSize}`);
      const data = await res.json();
      setHistory(data.logs || []);
      setHistoryTotalCount(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
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

    addLog(`Khởi chạy tìm kiếm với từ khóa/URL: "${keyword}"`, 'info');

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
        loadHistory(1);
        setHistoryPage(1);
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
      setHistoryPage(1);
      loadHistory(1);
    } catch (err) {
      showToast('Lỗi khi xóa lịch sử', true);
    }
  };

  const historyTotalPages = Math.max(1, Math.ceil(historyTotalCount / historyPageSize));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);

  const goToHistoryPage = (page: number) => {
    if (page >= 1 && page <= historyTotalPages) setHistoryPage(page);
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
              <Input
                type="text"
                placeholder="Nhập từ khóa hoặc domain..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isCrawling}
              />
            </div>
            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="shrink-0"
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
            </Button>
          </form>
        </div>
      </div>

      {/* Progress Card */}
      <ProgressCard
        showProgressCard={showProgressCard}
        crawlStatus={crawlStatus}
        progress={progress}
        consoleLogs={consoleLogs}
        consoleContainerRef={consoleContainerRef}
      />

      {/* History Card */}
      <HistoryCard
        history={history}
        loading={historyLoading}
        totalCount={historyTotalCount}
        currentPage={safeHistoryPage}
        totalPages={historyTotalPages}
        pageSize={historyPageSize}
        onPageChange={goToHistoryPage}
        onClearHistoryClick={() => setShowClearHistoryConfirm(true)}
        onRowClick={(log) => {
          setSelectedCrawlLog(log);
          setShowLogLeadsModal(true);
        }}
      />

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

      {/* Leads list modal for selected crawl log */}
      <CrawlLeadsModal
        open={showLogLeadsModal}
        crawlLog={selectedCrawlLog}
        leads={modalLeads}
        loading={modalLoading}
        totalCount={modalTotalCount}
        currentPage={safeModalPage}
        totalPages={modalTotalPages}
        pageSize={modalPageSize}
        onPageChange={goToModalPage}
        onClose={() => setShowLogLeadsModal(false)}
      />
    </div>
  );
}

// Memoized Subcomponents to prevent re-renders when typing

interface ProgressCardProps {
  showProgressCard: boolean;
  crawlStatus: string;
  progress: number;
  consoleLogs: ConsoleLog[];
  consoleContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ProgressCard = React.memo(function ProgressCard({
  showProgressCard,
  crawlStatus,
  progress,
  consoleLogs,
  consoleContainerRef
}: ProgressCardProps) {
  const getStatusIcon = () => {
    if (crawlStatus === 'Đang quét...') {
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
    if (crawlStatus === 'Hoàn thành') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (crawlStatus === 'Lỗi') {
      return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  if (!showProgressCard) return null;
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4 animate-scale-in">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-white flex items-center gap-2">
          {getStatusIcon()}
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
          className="h-full bg-gradient-to-r from-primary via-primary-to to-secondary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={consoleContainerRef}
        className="bg-console-bg border border-console-border rounded-xl p-4 h-48 sm:h-64 overflow-y-auto font-mono text-xs text-console-text-info space-y-1.5 scrollbar-thin"
      >
        {consoleLogs.map((log, idx) => (
          <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${log.type === 'success' ? 'text-console-text-success border-console-border-success' :
            log.type === 'error' ? 'text-console-text-error border-console-border-error' :
              log.type === 'warning' ? 'text-console-text-warning border-console-border-warning' :
                'text-console-text-info border-console-border-info'
            }`}>
            <span className="text-console-text-time mr-2">[{log.timestamp}]</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
});

interface HistoryCardProps {
  history: HistoryItem[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onClearHistoryClick: () => void;
  onRowClick: (log: HistoryItem) => void;
}

const HistoryCard = React.memo(function HistoryCard({
  history,
  loading,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onClearHistoryClick,
  onRowClick
}: HistoryCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Lịch sử quét
        </h3>
        {history.length > 0 && (
          <Button
            variant="destructive"
            size="lg"
            onClick={onClearHistoryClick}
          >
            <Trash2 className="w-4 h-4" />
            Xóa lịch sử
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 font-mono gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Đang tải lịch sử...
        </div>
      ) : (
        <DataTable
          columns={React.useMemo<Column<HistoryItem>[]>(() => [
            {
              id: 'timestamp',
              header: "Thời gian",
              accessor: (log) => new Date(log.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
              className: "px-5 py-4 font-semibold font-sans text-xs uppercase text-slate-400",
              cellClassName: "px-5 py-4 text-slate-400 font-mono",
            },
            {
              id: 'keyword',
              header: "Từ khóa / URL",
              accessor: (log) => log.keyword,
              className: "px-5 py-4 font-semibold font-sans text-xs uppercase text-slate-400",
              cellClassName: "px-5 py-4 font-semibold text-slate-200",
            },
            {
              id: 'urlsCount',
              header: "Số URL quét",
              accessor: (log) => `${log.urlsCount} URLs`,
              className: "px-5 py-4 font-semibold font-sans text-xs uppercase text-slate-400",
              cellClassName: "px-5 py-4 text-slate-400 font-mono",
            },
            {
              id: 'newLeadsCount',
              header: "Số Leads mới",
              accessor: (log) => `+${log.newLeadsCount} Leads`,
              className: "px-5 py-4 font-semibold font-sans text-xs uppercase text-slate-400",
              cellClassName: "px-5 py-4 text-emerald-400 font-semibold font-mono",
            }
          ], [])}
          data={history}
          keyExtractor={(log) => log.id}
          onRowClick={(log) => onRowClick(log)}
          emptyState="Chưa có lịch sử quét nào."
          pagination={{
            currentPage,
            totalPages,
            totalCount,
            pageSize,
            onPageChange,
            itemLabel: "phiên quét",
          }}
        />
      )}
    </div>
  );
});
