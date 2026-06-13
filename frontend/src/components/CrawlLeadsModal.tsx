import React from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { HistoryItem, Lead } from './types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
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
  onPageChange,
  onClose,
}: CrawlLeadsModalProps) {
  const columns = React.useMemo<Column<Lead>[]>(() => [
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 font-semibold text-slate-200 truncate font-sans",
      width: 220,
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
      width: 240,
    },
    {
      id: 'phone',
      header: "Số điện thoại",
      accessor: (lead) => lead.phone || '—',
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 text-slate-400 font-mono text-xs",
      width: 140,
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
      cellClassName: "px-4 py-3",
      width: 220,
    }
  ], []);

  if (!crawlLog) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl max-h-[85vh] overflow-hidden"
      title={`Kết quả cào cho: "${crawlLog.keyword}"`}
      description={`Thời gian: ${new Date(crawlLog.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} | Tìm thấy ${totalCount} leads`}
      footer={
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer font-sans h-auto ml-auto"
        >
          Đóng
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={leads}
        keyExtractor={(lead) => lead.id}
        emptyState="Không tìm thấy lead nào thuộc phiên cào này hoặc đã bị xóa."
        className="w-full text-sm text-left text-slate-300"
        scrollableBody
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange,
          itemLabel: "leads",
        }}
      />
    </Modal>
  );
}
