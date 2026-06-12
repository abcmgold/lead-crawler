import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, Clock, Trash2, Sparkles, X, ExternalLink, ChevronFirst, ChevronLast, CheckCircle2, AlertCircle } from 'lucide-react';
import { HistoryItem, Lead } from './types';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import ConfirmDialog from './ConfirmDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DataTable, Column } from '@/components/ui/data-table';

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
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('Đang quét...');
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Leads details modal states
  const [selectedCrawlLog, setSelectedCrawlLog] = useState<HistoryItem | null>(null);
  const [showLogLeadsModal, setShowLogLeadsModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);

  useEffect(() => {
    setModalCurrentPage(1);
  }, [selectedCrawlLog]);

  const matchingLeads = React.useMemo(() => {
    if (!selectedCrawlLog) return [];
    return leads.filter(lead => {
      if (lead.crawlLogId === selectedCrawlLog.id) return true;
      // Fallback matching
      if (lead.keyword === selectedCrawlLog.keyword) {
        const leadTime = new Date(lead.createdAt).getTime();
        const logTime = new Date(selectedCrawlLog.timestamp).getTime();
        return Math.abs(leadTime - logTime) < 120000; // 2 minutes
      }
      return false;
    });
  }, [leads, selectedCrawlLog]);

  const modalPageSize = 10;
  const modalTotalPages = Math.max(1, Math.ceil(matchingLeads.length / modalPageSize));
  const safeModalPage = Math.min(modalCurrentPage, modalTotalPages);
  const modalStartIndex = (safeModalPage - 1) * modalPageSize;
  const pagedModalLeads = matchingLeads.slice(modalStartIndex, modalStartIndex + modalPageSize);

  const goToModalPage = (page: number) => {
    if (page >= 1 && page <= modalTotalPages) setModalCurrentPage(page);
  };

  const getModalPageNumbers = (): (number | 'ellipsis')[] => {
    if (modalTotalPages <= 7) return Array.from({ length: modalTotalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [];
    if (safeModalPage <= 4) {
      pages.push(1, 2, 3, 4, 5, 'ellipsis', modalTotalPages);
    } else if (safeModalPage >= modalTotalPages - 3) {
      pages.push(1, 'ellipsis', modalTotalPages - 4, modalTotalPages - 3, modalTotalPages - 2, modalTotalPages - 1, modalTotalPages);
    } else {
      pages.push(1, 'ellipsis', safeModalPage - 1, safeModalPage, safeModalPage + 1, 'ellipsis', modalTotalPages);
    }
    return pages;
  };

  const modalColumns = React.useMemo<Column<Lead>[]>(() => [
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 font-semibold text-slate-200 truncate max-w-[200px] font-sans",
    },
    {
      id: 'email',
      header: "Email",
      accessor: (lead) => (
        <code className="text-primary font-mono text-xs bg-primary/5 px-2 py-0.5 rounded border border-primary/10 select-all">
          {lead.email}
        </code>
      ),
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3",
    },
    {
      id: 'phone',
      header: "Số điện thoại",
      accessor: (lead) => lead.phone || '—',
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 text-slate-400 font-mono text-xs",
    },
    {
      id: 'website',
      header: "Website",
      accessor: (lead) => (
        <a
          href={lead.website}
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-primary hover:underline inline-flex items-center gap-1 transition-colors text-xs font-sans"
        >
          {lead.website}
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 max-w-[200px] truncate",
    }
  ], []);

  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
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
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-pink-600 text-primary-foreground font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.45)] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base shrink-0 font-sans h-auto"
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
      {showLogLeadsModal && selectedCrawlLog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Kết quả cào cho: "{selectedCrawlLog.keyword}"</h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Thời gian: {new Date(selectedCrawlLog.timestamp).toLocaleString('vi-VN')} | Tổng cộng: {matchingLeads.length} leads (Mới: +{selectedCrawlLog.newLeadsCount} | Trùng/Cũ: {Math.max(0, matchingLeads.length - selectedCrawlLog.newLeadsCount)})
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogLeadsModal(false)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {matchingLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono">
                  Không tìm thấy lead nào thuộc phiên cào này hoặc đã bị xóa.
                </div>
              ) : (
                <DataTable
                  columns={modalColumns}
                  data={pagedModalLeads}
                  keyExtractor={(lead) => lead.id}
                  emptyState="Không tìm thấy lead nào thuộc phiên cào này hoặc đã bị xóa."
                  className="w-full text-sm text-left text-slate-300"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-slate-400 font-mono">
                {matchingLeads.length > 0 && (
                  <>
                    Hiển thị <span className="text-white font-semibold">{modalStartIndex + 1}–{Math.min(modalStartIndex + modalPageSize, matchingLeads.length)}</span> trong số <span className="text-white font-semibold">{matchingLeads.length}</span> leads
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {modalTotalPages > 1 && (
                  <Pagination className="w-auto mx-0">
                    <PaginationContent className="gap-0.5">
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToModalPage(1); }}
                          aria-disabled={safeModalPage === 1}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${safeModalPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                          aria-label="First page"
                        >
                          <ChevronFirst className="w-4 h-4" />
                        </PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationPrevious
                          text="Trước"
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToModalPage(safeModalPage - 1); }}
                          aria-disabled={safeModalPage === 1}
                          className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${safeModalPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                        />
                      </PaginationItem>

                      {getModalPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                          <PaginationItem key={`modal-ellipsis-${idx}`}>
                            <PaginationEllipsis className="text-slate-500 w-8 h-8" />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={`modal-page-${page}`}>
                            <PaginationLink
                              href="#"
                              isActive={page === safeModalPage}
                              onClick={(e) => { e.preventDefault(); goToModalPage(page); }}
                              className={`w-8 h-8 text-xs rounded-lg border-0 transition-all ${page === safeModalPage
                                ? 'bg-gradient-to-r from-primary to-pink-600 text-white shadow-md shadow-primary/20 font-bold border-0'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          text="Sau"
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToModalPage(safeModalPage + 1); }}
                          aria-disabled={safeModalPage === modalTotalPages}
                          className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${safeModalPage === modalTotalPages ? 'opacity-30 pointer-events-none' : ''}`}
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToModalPage(modalTotalPages); }}
                          aria-disabled={safeModalPage === modalTotalPages}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${safeModalPage === modalTotalPages ? 'opacity-30 pointer-events-none' : ''}`}
                          aria-label="Last page"
                        >
                          <ChevronLast className="w-4 h-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowLogLeadsModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer font-sans h-auto"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
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
          className="h-full bg-gradient-to-r from-primary via-pink-500 to-purple-500 rounded-full transition-all duration-300"
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
  onClearHistoryClick: () => void;
  onRowClick: (log: HistoryItem) => void;
}

const HistoryCard = React.memo(function HistoryCard({
  history,
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
            onClick={onClearHistoryClick}
            className="text-xs text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-medium self-start sm:self-auto h-auto"
          >
            <Trash2 className="w-4 h-4" />
            Xóa lịch sử
          </Button>
        )}
      </div>

      <DataTable
        columns={React.useMemo<Column<HistoryItem>[]>(() => [
          {
            id: 'timestamp',
            header: "Thời gian",
            accessor: (log) => new Date(log.timestamp).toLocaleString('vi-VN'),
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
        data={[...history].reverse()}
        keyExtractor={(log) => log.id}
        onRowClick={(log) => onRowClick(log)}
        rowClassName="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
        emptyState="Chưa có lịch sử quét nào."
        containerClassName="rounded-xl border border-white/5 overflow-hidden"
        className="w-full text-sm text-left text-slate-300"
      />
    </div>
  );
});
