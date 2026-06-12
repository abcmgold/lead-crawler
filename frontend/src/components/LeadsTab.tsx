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
import { CustomSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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

  // Local paginated leads data
  const [paginatedLeads, setPaginatedLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPaginatedLeads = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        search: searchQuery,
        crawlLogId: selectedLogId
      });
      const res = await apiFetch(`/api/leads?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPaginatedLeads(data.leads || []);
        setTotalLeadsCount(data.total || 0);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu leads phân trang:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever pagination parameters change, or new leads are crawled
  // (CrawlerTab triggers parent leads update)
  useEffect(() => {
    fetchPaginatedLeads();
  }, [currentPage, pageSize, searchQuery, selectedLogId, leads]);

  const isAllFilteredSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l.id));

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalLeadsCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedLeads = paginatedLeads;
  const startIndex = (safePage - 1) * pageSize;

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
    const nextSelected = new Set(selectedIds);
    if (e.target.checked) {
      paginatedLeads.forEach(l => nextSelected.add(l.id));
    } else {
      paginatedLeads.forEach(l => nextSelected.delete(l.id));
    }
    onSelectionChange(nextSelected);
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
        <code
          title={lead.email}
          className="text-primary font-mono text-xs select-all bg-primary/5 px-2 py-1 rounded border border-primary/10 block truncate max-w-[180px]"
        >
          {lead.email}
        </code>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 max-w-[200px]",
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
          title={lead.website}
          className="text-slate-400 hover:text-primary inline-flex items-center gap-1.5 hover:underline transition-colors duration-150 font-sans max-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{lead.website}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 max-w-[200px]",
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

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        crawlLogId: selectedLogId
      });
      const res = await apiFetch(`/api/leads?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu để xuất');
      const exportLeads: Lead[] = await res.json();

      if (exportLeads.length === 0) {
        showToast('Không có dữ liệu để xuất!', true);
        return;
      }

      let csvContent = "\uFEFF"; // UTF-8 BOM
      csvContent += "Tên Doanh Nghiệp,Email,Số điện thoại,Website,Trạng thái Email,Từ khóa,Ngày tạo\n";

      exportLeads.forEach(lead => {
        const row = [
          `"${lead.name.replace(/"/g, '""')}"`,
          `"${lead.email}"`,
          `"${lead.phone || ''}"`,
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
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất file CSV!', true);
    }
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
          <CustomSelect
            value={selectedLogId || "all"}
            onValueChange={(val) => {
              setSelectedLogId(val === "all" ? "" : val);
              setCurrentPage(1);
            }}
            placeholder="-- Lọc theo lần cào --"
            className="w-full sm:w-[240px] shrink-0"
            triggerClassName="bg-slate-950/40"
            options={[
              { value: "all", label: "-- Lọc theo lần cào --" },
              ...crawlLogs.map(log => {
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
              })
            ]}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-sans h-auto"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
          <Button
            variant="destructive"
            onClick={onClearAll}
            className="text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-sans h-auto"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </Button>
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
          emptyState={totalLeadsCount === 0 ? 'Chưa có leads nào. Hãy quét từ khóa ở tab cào.' : 'Không tìm thấy kết quả phù hợp.'}
          containerClassName="relative w-full overflow-x-auto"
          className="w-full text-sm text-left text-slate-300 border-collapse"
        />

        {/* Pagination Footer */}
        <div className="bg-slate-900/30 border-t border-white/5 px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Info + page size */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 font-mono">
            <span>
              {totalLeadsCount === 0 ? (
                'Không có dữ liệu'
              ) : (
                <>
                  <span className="text-white font-semibold">{startIndex + 1}–{Math.min(startIndex + pageSize, totalLeadsCount)}</span>
                  {' / '}
                  <span className="text-white font-semibold">{totalLeadsCount}</span>
                  {' leads'}
                  {totalLeadsCount !== leads.length && (
                    <span className="text-slate-500"> (lọc từ {leads.length})</span>
                  )}
                </>
              )}
            </span>
            <span className="text-primary font-semibold">Đã chọn: {selectedIds.size}</span>
            {/* Page size selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Hiển thị:</span>
              <CustomSelect
                value={String(pageSize)}
                onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                triggerClassName="bg-slate-950/60 border border-white/10 text-slate-300 rounded-lg px-2 py-1 text-xs font-mono w-16 h-7 focus:ring-0"
                options={PAGE_SIZE_OPTIONS.map(n => ({
                  value: String(n),
                  label: String(n)
                }))}
                openDirection="up"
              />
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
                          ? 'bg-gradient-to-r from-primary to-primary-to text-white shadow-md shadow-primary/20 font-bold border-0'
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
