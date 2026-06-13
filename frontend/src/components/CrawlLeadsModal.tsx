import React from 'react';
import { ExternalLink } from 'lucide-react';
import { HistoryItem, LeadEmail, LeadPhone, LeadSocial } from './types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DataTable, Column } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLeadListData } from '@/hooks/useLeadListData';

interface CrawlLeadsModalProps {
  open: boolean;
  crawlLog: HistoryItem | null;
  onClose: () => void;
}

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

export default function CrawlLeadsModal({ open, crawlLog, onClose }: CrawlLeadsModalProps) {
  const crawlLogId = crawlLog?.id || '';
  const enabled = open && !!crawlLog;

  const emails = useLeadListData<LeadEmail>({ endpoint: '/api/leads/emails', crawlLogId, enabled });
  const phones = useLeadListData<LeadPhone>({ endpoint: '/api/leads/phones', crawlLogId, enabled });
  const socials = useLeadListData<LeadSocial>({ endpoint: '/api/leads/socials', crawlLogId, enabled });

  const emailColumns = React.useMemo<Column<LeadEmail>[]>(() => [
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 font-semibold text-slate-200 truncate font-sans",
      width: 240,
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
      width: 260,
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

  const phoneColumns = React.useMemo<Column<LeadPhone>[]>(() => [
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 font-semibold text-slate-200 truncate font-sans",
      width: 240,
    },
    {
      id: 'phone',
      header: "Số điện thoại",
      accessor: (lead) => lead.phone,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 text-slate-200 font-mono text-xs",
      width: 160,
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

  const socialColumns = React.useMemo<Column<LeadSocial>[]>(() => [
    {
      id: 'name',
      header: "Doanh Nghiệp / Site",
      accessor: (lead) => lead.name,
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3 font-semibold text-slate-200 truncate font-sans",
      width: 220,
    },
    {
      id: 'platform',
      header: "Nền tảng",
      accessor: (lead) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-primary/10 text-primary border-primary/20 font-sans">
          {SOCIAL_PLATFORM_LABELS[lead.platform] || lead.platform}
        </span>
      ),
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3",
      width: 140,
    },
    {
      id: 'url',
      header: "Đường dẫn",
      accessor: (lead) => (
        <a
          href={lead.url}
          target="_blank"
          rel="noreferrer"
          title={lead.url}
          className="text-slate-400 hover:text-primary hover:underline inline-flex items-center gap-1 max-w-full transition-colors text-xs font-sans"
        >
          <span className="truncate min-w-0">{lead.url}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-4 py-3 font-sans font-semibold text-xs uppercase text-slate-400",
      cellClassName: "px-4 py-3",
      width: 280,
    }
  ], []);

  if (!crawlLog) return null;

  const displayKeyword = crawlLog.keyword.length > 50
    ? crawlLog.keyword.slice(0, 50) + '...'
    : crawlLog.keyword;
  const firstLead = emails.data[0] || phones.data[0] || socials.data[0];
  const siteTitle = firstLead?.name;
  const isUrl = crawlLog.keyword.startsWith('http://') || crawlLog.keyword.startsWith('https://') || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(crawlLog.keyword);
  const displayTitle = (isUrl && siteTitle) ? siteTitle : displayKeyword;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl h-[85vh] overflow-hidden"
      title={<span title={crawlLog.keyword}>Kết quả cào cho: "{displayTitle}"</span>}
      description={`Thời gian: ${new Date(crawlLog.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`}
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
      <Tabs defaultValue="emails" className="flex flex-col flex-1 min-h-0">
        <TabsList>
          <TabsTrigger value="emails">Email ({emails.totalCount})</TabsTrigger>
          <TabsTrigger value="phones">Số điện thoại ({phones.totalCount})</TabsTrigger>
          <TabsTrigger value="socials">Mạng xã hội ({socials.totalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-4 flex flex-col flex-1 min-h-0">
          <DataTable
            columns={emailColumns}
            data={emails.data}
            keyExtractor={(lead) => lead.id}
            emptyState="Không tìm thấy email nào thuộc phiên cào này."
            className="w-full text-sm text-left text-slate-300"
            scrollableBody
            loading={emails.loading}
            pagination={{
              currentPage: emails.currentPage,
              totalPages: emails.totalPages,
              totalCount: emails.totalCount,
              pageSize: emails.pageSize,
              onPageChange: emails.goToPage,
              itemLabel: "email",
            }}
          />
        </TabsContent>

        <TabsContent value="phones" className="mt-4 flex flex-col flex-1 min-h-0">
          <DataTable
            columns={phoneColumns}
            data={phones.data}
            keyExtractor={(lead) => lead.id}
            emptyState="Không tìm thấy số điện thoại nào thuộc phiên cào này."
            className="w-full text-sm text-left text-slate-300"
            scrollableBody
            loading={phones.loading}
            pagination={{
              currentPage: phones.currentPage,
              totalPages: phones.totalPages,
              totalCount: phones.totalCount,
              pageSize: phones.pageSize,
              onPageChange: phones.goToPage,
              itemLabel: "số điện thoại",
            }}
          />
        </TabsContent>

        <TabsContent value="socials" className="mt-4 flex flex-col flex-1 min-h-0">
          <DataTable
            columns={socialColumns}
            data={socials.data}
            keyExtractor={(lead) => lead.id}
            emptyState="Không tìm thấy mạng xã hội nào thuộc phiên cào này."
            className="w-full text-sm text-left text-slate-300"
            scrollableBody
            loading={socials.loading}
            pagination={{
              currentPage: socials.currentPage,
              totalPages: socials.totalPages,
              totalCount: socials.totalCount,
              pageSize: socials.pageSize,
              onPageChange: socials.goToPage,
              itemLabel: "mạng xã hội",
            }}
          />
        </TabsContent>
      </Tabs>
    </Modal>
  );
}
