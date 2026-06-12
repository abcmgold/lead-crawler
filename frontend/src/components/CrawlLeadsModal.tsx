import React from 'react';
import { Loader2, ExternalLink, ChevronFirst, ChevronLast } from 'lucide-react';
import { HistoryItem, Lead } from './types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
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

interface CrawlLeadsModalProps {
  open: boolean;
  crawlLog: HistoryItem | null;
  leads: Lead[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageNumbers: (number | 'ellipsis')[];
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export default function CrawlLeadsModal({
  open,
  crawlLog,
  leads,
  loading,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  pageNumbers,
  onPageChange,
  onClose,
}: CrawlLeadsModalProps) {
  const columns = React.useMemo<Column<Lead>[]>(() => [
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
        <code
          title={lead.email}
          className="text-primary font-mono text-xs bg-primary/5 px-2 py-0.5 rounded border border-primary/10 select-all inline-block max-w-full truncate align-middle"
        >
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
          title={lead.website}
          className="text-slate-400 hover:text-primary hover:underline inline-flex items-center gap-1 max-w-full transition-colors text-xs font-sans"
        >
          <span className="truncate min-w-0">{lead.website}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 max-w-[200px]",
    }
  ], []);

  if (!crawlLog) return null;

  const startIndex = (currentPage - 1) * pageSize;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl max-h-[85vh] overflow-hidden"
      title={`Kết quả cào cho: "${crawlLog.keyword}"`}
      description={`Thời gian: ${new Date(crawlLog.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} | Tìm thấy ${totalCount} leads`}
      footer={
        <>
          <div className="text-xs text-slate-400 font-mono">
            {totalCount > 0 && !loading && (
              <>
                Hiển thị <span className="text-white font-semibold">{startIndex + 1}–{Math.min(startIndex + pageSize, totalCount)}</span> trong số <span className="text-white font-semibold">{totalCount}</span> leads
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {totalPages > 1 && !loading && (
              <Pagination className="w-auto mx-0">
                <PaginationContent className="gap-0.5">
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); onPageChange(1); }}
                      aria-disabled={currentPage === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${currentPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                      aria-label="First page"
                    >
                      <ChevronFirst className="w-4 h-4" />
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationPrevious
                      text="Trước"
                      href="#"
                      onClick={(e) => { e.preventDefault(); onPageChange(currentPage - 1); }}
                      aria-disabled={currentPage === 1}
                      className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${currentPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`modal-ellipsis-${idx}`}>
                        <PaginationEllipsis className="text-slate-500 w-8 h-8" />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={`modal-page-${page}`}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                          className={`w-8 h-8 text-xs rounded-lg border-0 transition-all ${page === currentPage
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
                      onClick={(e) => { e.preventDefault(); onPageChange(currentPage + 1); }}
                      aria-disabled={currentPage === totalPages}
                      className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}
                      aria-disabled={currentPage === totalPages}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
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
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer font-sans h-auto"
            >
              Đóng
            </Button>
          </div>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-mono gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Đang tải dữ liệu...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-mono">
          Không tìm thấy lead nào thuộc phiên cào này hoặc đã bị xóa.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(lead) => lead.id}
          emptyState="Không tìm thấy lead nào thuộc phiên cào này hoặc đã bị xóa."
          className="w-full text-sm text-left text-slate-300"
          containerClassName="rounded-xl border border-white/5 bg-slate-950/20 overflow-hidden flex-1 flex flex-col min-h-0"
          wrapperClassName="flex-1 min-h-0"
          scrollableBody
        />
      )}
    </Modal>
  );
}
