import React, { useState, useMemo, useEffect } from 'react';
import { Download, Trash2, Search, ExternalLink, ChevronFirst, ChevronLast } from 'lucide-react';
import { Lead, HistoryItem } from './types';
import { apiFetch } from '@/lib/api';
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

interface LeadsTabProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onClearAll: () => void;
  showToast: (message: string, isError?: boolean) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function LeadsTab({ leads, selectedIds, onSelectionChange, onClearAll, showToast }: LeadsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [crawlLogs, setCrawlLogs] = useState<HistoryItem[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  useEffect(() => {
    loadCrawlLogs();
  }, []);

  const loadCrawlLogs = async () => {
    try {
      const res = await apiFetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setCrawlLogs([...data].reverse());
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử cào:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter leads and sort by newest first
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (selectedLogId) {
      const log = crawlLogs.find(l => l.id === selectedLogId);
      if (log) {
        result = result.filter(lead => {
          if (lead.crawlLogId === selectedLogId) return true;
          // Fallback matching
          if (lead.keyword === log.keyword) {
            const leadTime = new Date(lead.createdAt).getTime();
            const logTime = new Date(log.timestamp).getTime();
            return Math.abs(leadTime - logTime) < 120000; // 2 minutes
          }
          return false;
        });
      }
    }

    return result
      .filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.website.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, searchQuery, selectedLogId, crawlLogs]);

  const isAllFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Build page number buttons with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', safePage - 1, safePage, safePage + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredLeads.map(l => l.id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const nextSelected = new Set(selectedIds);
    if (checked) {
      nextSelected.add(id);
    } else {
      nextSelected.delete(id);
    }
    onSelectionChange(nextSelected);
  };

  const columns = useMemo<Column<Lead>[]>(() => [
    {
      id: 'select',
      header: (
        <div className="flex justify-center items-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 checked:bg-primary checked:border-primary focus:ring-0 focus:outline-none"
            checked={isAllFilteredSelected}
            onChange={(e) => handleSelectAll(e)}
          />
        </div>
      ),
      accessor: (lead) => {
        const isSelected = selectedIds.has(lead.id);
        return (
          <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 focus:ring-0 focus:outline-none"
              checked={isSelected}
              onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
            />
          </div>
        );
      },
      className: "p-4 w-14 text-center",
      cellClassName: "p-4 text-center",
    },
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 font-semibold text-slate-200 max-w-[200px] truncate font-sans",
    },
    {
      id: 'email',
      header: "Email",
      accessor: (lead) => (
        <code className="text-primary font-mono text-xs select-all bg-primary/5 px-2 py-1 rounded border border-primary/10">
          {lead.email}
        </code>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4",
    },
    {
      id: 'phone',
      header: "Số điện thoại",
      accessor: (lead) => lead.phone || '—',
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 text-slate-400 font-mono text-xs",
    },
    {
      id: 'website',
      header: "Website",
      accessor: (lead) => (
        <a
          href={lead.website}
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-primary inline-flex items-center gap-1.5 hover:underline transition-colors duration-150 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.website}
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 max-w-[220px] truncate",
    },
    {
      id: 'emailStatus',
      header: "Trạng thái Email",
      accessor: (lead) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border font-sans ${lead.emailStatus === 'Gửi thành công' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
          lead.emailStatus.startsWith('Thất bại') ? 'bg-rose-950/30 text-rose-400 border-rose-500/20' :
            'bg-slate-900/50 text-slate-400 border-white/5'
          }`}>
          {lead.emailStatus}
        </span>
      ),
      className: "px-6 py-4 font-semibold text-right font-sans",
      cellClassName: "px-6 py-4 text-right",
    }
  ], [isAllFilteredSelected, selectedIds, handleSelectAll, handleSelectOne]);

  const handleExportCSV = () => {
    if (leads.length === 0) {
      showToast('Không có dữ liệu để xuất!', true);
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Tên Doanh Nghiệp,Email,Số điện thoại,Website,Trạng thái Email,Từ khóa,Ngày tạo\n";

    leads.forEach(lead => {
      const row = [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.website}"`,
        `"${lead.emailStatus}"`,
        `"${lead.keyword}"`,
        `"${lead.createdAt}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải xuống file CSV thành công!');
  };



  return (
    <div className="space-y-6 animate-scale-in">
      {/* Top filters and actions */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Filters Wrapper */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-slate-500 font-sans"
              placeholder="Lọc theo Tên, Email, Số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Crawl Batch Filter */}
          <select
            value={selectedLogId}
            onChange={(e) => {
              setSelectedLogId(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 cursor-pointer min-w-[200px]"
          >
            <option value="" className="bg-slate-950 text-slate-400">-- Lọc theo lần cào --</option>
            {crawlLogs.map(log => {
              const dateStr = new Date(log.timestamp).toLocaleString('vi-VN', {
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              });
              return (
                <option key={log.id} value={log.id} className="bg-slate-950 text-white">
                  {log.keyword} ({dateStr}) — {log.newLeadsCount} leads
                </option>
              );
            })}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end shrink-0">
          <button
            onClick={handleExportCSV}
            className="bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
          <button
            onClick={onClearAll}
            className="text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl shadow-xl overflow-hidden border border-white/5">
        <DataTable
          columns={columns}
          data={pagedLeads}
          keyExtractor={(lead) => lead.id}
          onRowClick={(lead) => handleSelectOne(lead.id, !selectedIds.has(lead.id))}
          rowClassName={(lead) => {
            const isSelected = selectedIds.has(lead.id);
            return `border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-primary/[0.03]' : ''}`;
          }}
          emptyState={leads.length === 0 ? 'Chưa có leads nào. Hãy quét từ khóa ở tab cào.' : 'Không tìm thấy kết quả phù hợp.'}
          containerClassName="relative w-full overflow-x-auto"
          className="w-full text-sm text-left text-slate-300 border-collapse"
        />

        {/* Pagination Footer */}
        <div className="bg-slate-900/30 border-t border-white/5 px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Info + page size */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 font-mono">
            <span>
              {filteredLeads.length === 0 ? (
                'Không có dữ liệu'
              ) : (
                <>
                  <span className="text-white font-semibold">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredLeads.length)}</span>
                  {' / '}
                  <span className="text-white font-semibold">{filteredLeads.length}</span>
                  {' leads'}
                  {filteredLeads.length !== leads.length && (
                    <span className="text-slate-500"> (lọc từ {leads.length})</span>
                  )}
                </>
              )}
            </span>
            <span className="text-primary font-semibold">Đã chọn: {selectedIds.size}</span>
            {/* Page size selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-950/60 border border-white/10 text-slate-300 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary/40 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Pagination className="w-auto mx-0 max-w-full overflow-x-auto scrollbar-none">
              <PaginationContent className="gap-0.5">
                {/* First page */}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(1); }}
                    aria-disabled={safePage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${safePage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                    aria-label="First page"
                  >
                    <ChevronFirst className="w-4 h-4" />
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationPrevious
                    text="Trước"
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(safePage - 1); }}
                    aria-disabled={safePage === 1}
                    className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${safePage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="text-slate-500 w-8 h-8" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safePage}
                        onClick={(e) => { e.preventDefault(); goToPage(page); }}
                        className={`w-8 h-8 text-xs rounded-lg border-0 transition-all ${page === safePage
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
                    onClick={(e) => { e.preventDefault(); goToPage(safePage + 1); }}
                    aria-disabled={safePage === totalPages}
                    className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${safePage === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                </PaginationItem>

                {/* Last page */}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(totalPages); }}
                    aria-disabled={safePage === totalPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${safePage === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                    aria-label="Last page"
                  >
                    <ChevronLast className="w-4 h-4" />
                  </PaginationLink>
                </PaginationItem>

              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
