import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { LeadEmail, LeadPhone, LeadSocial, HistoryItem } from './types';
import { apiFetch } from '@/lib/api';
import { Column } from '@/components/ui/data-table';
import { CustomSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLeadListData } from '@/hooks/useLeadListData';
import { LeadDataTab } from './LeadDataTab';
import ConfirmDialog from './ConfirmDialog';

interface LeadsTabProps {
  leadsVersion: number;
  leadsCount: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>, currentLeads: LeadEmail[]) => void;
  onClearAll: () => void;
  showToast: (message: string, isError?: boolean) => void;
  onRefresh?: () => void;
}

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

function downloadCSV(filename: string, header: string, rows: string[][]) {
  let csvContent = "﻿" + header + "\n"; // UTF-8 BOM
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function LeadsTab({ leadsVersion, leadsCount, selectedIds, onSelectionChange, onClearAll, showToast, onRefresh }: LeadsTabProps) {
  const [crawlLogs, setCrawlLogs] = useState<HistoryItem[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  // Selection states for phone and social tabs
  const [selectedPhoneIds, setSelectedPhoneIds] = useState<Set<string>>(new Set());
  const [selectedSocialIds, setSelectedSocialIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

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

  const emails = useLeadListData<LeadEmail>({ endpoint: '/api/leads/emails', leadsVersion, crawlLogId: selectedLogId });
  const phones = useLeadListData<LeadPhone>({ endpoint: '/api/leads/phones', leadsVersion, crawlLogId: selectedLogId });
  const socials = useLeadListData<LeadSocial>({ endpoint: '/api/leads/socials', leadsVersion, crawlLogId: selectedLogId });

  // Email selection helpers
  const isAllFilteredSelected = emails.data.length > 0 && emails.data.every(l => selectedIds.has(l.id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSelected = new Set(selectedIds);
    if (e.target.checked) {
      emails.data.forEach(l => nextSelected.add(l.id));
    } else {
      emails.data.forEach(l => nextSelected.delete(l.id));
    }
    onSelectionChange(nextSelected, emails.data);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const nextSelected = new Set(selectedIds);
    if (checked) {
      nextSelected.add(id);
    } else {
      nextSelected.delete(id);
    }
    onSelectionChange(nextSelected, emails.data);
  };

  // Phone selection helpers
  const isAllPhonesSelected = phones.data.length > 0 && phones.data.every(l => selectedPhoneIds.has(l.id));

  const handleSelectAllPhones = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSelected = new Set(selectedPhoneIds);
    if (e.target.checked) {
      phones.data.forEach(l => nextSelected.add(l.id));
    } else {
      phones.data.forEach(l => nextSelected.delete(l.id));
    }
    setSelectedPhoneIds(nextSelected);
  };

  const handleSelectOnePhone = (id: string, checked: boolean) => {
    const nextSelected = new Set(selectedPhoneIds);
    if (checked) {
      nextSelected.add(id);
    } else {
      nextSelected.delete(id);
    }
    setSelectedPhoneIds(nextSelected);
  };

  // Social selection helpers
  const isAllSocialsSelected = socials.data.length > 0 && socials.data.every(l => selectedSocialIds.has(l.id));

  const handleSelectAllSocials = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSelected = new Set(selectedSocialIds);
    if (e.target.checked) {
      socials.data.forEach(l => nextSelected.add(l.id));
    } else {
      socials.data.forEach(l => nextSelected.delete(l.id));
    }
    setSelectedSocialIds(nextSelected);
  };

  const handleSelectOneSocial = (id: string, checked: boolean) => {
    const nextSelected = new Set(selectedSocialIds);
    if (checked) {
      nextSelected.add(id);
    } else {
      nextSelected.delete(id);
    }
    setSelectedSocialIds(nextSelected);
  };

  // API deletion helper
  const deleteLeads = async (endpoint: string, ids: string[]) => {
    try {
      const res = await apiFetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        showToast('Xóa dữ liệu thành công!');
        onRefresh?.();
      } else {
        showToast('Có lỗi xảy ra khi xóa dữ liệu!', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xóa dữ liệu!', true);
    }
  };

  const handleDeleteEmails = async (ids: string[]) => {
    await deleteLeads('/api/leads/emails', ids);
    const nextSelected = new Set(selectedIds);
    ids.forEach(id => nextSelected.delete(id));
    onSelectionChange(nextSelected, []);
  };

  const handleDeletePhones = async (ids: string[]) => {
    await deleteLeads('/api/leads/phones', ids);
    const nextSelected = new Set(selectedPhoneIds);
    ids.forEach(id => nextSelected.delete(id));
    setSelectedPhoneIds(nextSelected);
  };

  const handleDeleteSocials = async (ids: string[]) => {
    await deleteLeads('/api/leads/socials', ids);
    const nextSelected = new Set(selectedSocialIds);
    ids.forEach(id => nextSelected.delete(id));
    setSelectedSocialIds(nextSelected);
  };

  // Confirm functions
  const confirmDeleteEmail = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Xóa Lead Email',
      description: 'Bạn có chắc chắn muốn xóa lead email này không? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        handleDeleteEmails([id]);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const confirmDeleteSelectedEmails = () => {
    const ids = Array.from(selectedIds);
    setDeleteConfirm({
      show: true,
      title: 'Xóa nhiều Lead Email',
      description: `Bạn có chắc chắn muốn xóa ${ids.length} lead email đã chọn không? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        handleDeleteEmails(ids);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const confirmDeletePhone = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Xóa Số Điện Thoại',
      description: 'Bạn có chắc chắn muốn xóa số điện thoại này không? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        handleDeletePhones([id]);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const confirmDeleteSelectedPhones = () => {
    const ids = Array.from(selectedPhoneIds);
    setDeleteConfirm({
      show: true,
      title: 'Xóa nhiều Số Điện Thoại',
      description: `Bạn có chắc chắn muốn xóa ${ids.length} số điện thoại đã chọn không? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        handleDeletePhones(ids);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const confirmDeleteSocial = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Xóa Mạng Xã Hội',
      description: 'Bạn có chắc chắn muốn xóa mạng xã hội này không? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        handleDeleteSocials([id]);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const confirmDeleteSelectedSocials = () => {
    const ids = Array.from(selectedSocialIds);
    setDeleteConfirm({
      show: true,
      title: 'Xóa nhiều Mạng Xã Hội',
      description: `Bạn có chắc chắn muốn xóa ${ids.length} mạng xã hội đã chọn không? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        handleDeleteSocials(ids);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const emailColumns = useMemo<Column<LeadEmail>[]>(() => [
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
          className="text-primary font-mono text-xs select-all bg-primary/5 px-2 py-1 rounded border border-primary/10 block truncate max-w-[220px]"
        >
          {lead.email}
        </code>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 max-w-[240px]",
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
      accessor: (lead) => {
        const isSuccess = lead.emailStatus === 'Gửi thành công';
        const isFailed = lead.emailStatus.startsWith('Thất bại');

        return (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border font-sans inline-flex items-center gap-1.5 shrink-0 ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.05)]' :
              isFailed ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.05)]' :
                'bg-slate-850/60 text-slate-400 border-white/5'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-400 animate-pulse' :
                isFailed ? 'bg-rose-400' :
                  'bg-slate-500'
              }`} />
            {lead.emailStatus}
          </span>
        );
      },
      className: "px-6 py-4 font-semibold text-right font-sans",
      cellClassName: "px-6 py-4 text-right",
    },
    {
      id: 'actions',
      header: "",
      accessor: (lead) => (
        <div className="flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDeleteEmail(lead.id)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-8 w-8 rounded-lg transition-colors duration-150"
            title="Xóa bản ghi"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "px-6 py-4 w-16 text-right font-semibold font-sans",
      cellClassName: "px-6 py-4 w-16 text-right",
    }
  ], [isAllFilteredSelected, selectedIds]);

  const phoneColumns = useMemo<Column<LeadPhone>[]>(() => [
    {
      id: 'select',
      header: (
        <div className="flex justify-center items-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 checked:bg-primary checked:border-primary focus:ring-0 focus:outline-none"
            checked={isAllPhonesSelected}
            onChange={(e) => handleSelectAllPhones(e)}
          />
        </div>
      ),
      accessor: (lead) => {
        const isSelected = selectedPhoneIds.has(lead.id);
        return (
          <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 focus:ring-0 focus:outline-none"
              checked={isSelected}
              onChange={(e) => handleSelectOnePhone(lead.id, e.target.checked)}
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
      id: 'phone',
      header: "Số điện thoại",
      accessor: (lead) => lead.phone,
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 text-slate-200 font-mono text-xs",
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
      id: 'keyword',
      header: "Từ khóa",
      accessor: (lead) => lead.keyword || '—',
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 text-slate-400 font-mono text-xs max-w-[160px] truncate",
    },
    {
      id: 'createdAt',
      header: "Ngày tạo",
      accessor: (lead) => new Date(lead.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      className: "px-6 py-4 font-semibold text-right font-sans",
      cellClassName: "px-6 py-4 text-right text-slate-400 font-mono text-xs",
    },
    {
      id: 'actions',
      header: "",
      accessor: (lead) => (
        <div className="flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDeletePhone(lead.id)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-8 w-8 rounded-lg transition-colors duration-150"
            title="Xóa bản ghi"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "px-6 py-4 w-16 text-right font-semibold font-sans",
      cellClassName: "px-6 py-4 w-16 text-right",
    }
  ], [isAllPhonesSelected, selectedPhoneIds]);

  const socialColumns = useMemo<Column<LeadSocial>[]>(() => [
    {
      id: 'select',
      header: (
        <div className="flex justify-center items-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 checked:bg-primary checked:border-primary focus:ring-0 focus:outline-none"
            checked={isAllSocialsSelected}
            onChange={(e) => handleSelectAllSocials(e)}
          />
        </div>
      ),
      accessor: (lead) => {
        const isSelected = selectedSocialIds.has(lead.id);
        return (
          <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer rounded bg-slate-950/60 border border-white/10 focus:ring-0 focus:outline-none"
              checked={isSelected}
              onChange={(e) => handleSelectOneSocial(lead.id, e.target.checked)}
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
      id: 'platform',
      header: "Nền tảng",
      accessor: (lead) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-primary/10 text-primary border-primary/20 font-sans">
          {SOCIAL_PLATFORM_LABELS[lead.platform] || lead.platform}
        </span>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4",
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
          className="text-slate-400 hover:text-primary inline-flex items-center gap-1.5 hover:underline transition-colors duration-150 font-sans max-w-[260px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{lead.url}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ),
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 max-w-[280px]",
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
      id: 'keyword',
      header: "Từ khóa",
      accessor: (lead) => lead.keyword || '—',
      className: "px-6 py-4 font-semibold font-sans",
      cellClassName: "px-6 py-4 text-slate-400 font-mono text-xs max-w-[160px] truncate",
    },
    {
      id: 'createdAt',
      header: "Ngày tạo",
      accessor: (lead) => new Date(lead.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      className: "px-6 py-4 font-semibold text-right font-sans",
      cellClassName: "px-6 py-4 text-right text-slate-400 font-mono text-xs",
    },
    {
      id: 'actions',
      header: "",
      accessor: (lead) => (
        <div className="flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDeleteSocial(lead.id)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-8 w-8 rounded-lg transition-colors duration-150"
            title="Xóa bản ghi"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "px-6 py-4 w-16 text-right font-semibold font-sans",
      cellClassName: "px-6 py-4 w-16 text-right",
    }
  ], [isAllSocialsSelected, selectedSocialIds]);

  const handleExportEmailsCSV = async () => {
    try {
      const queryParams = new URLSearchParams({ search: emails.searchTerm, crawlLogId: selectedLogId });
      const res = await apiFetch(`/api/leads/emails?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu để xuất');
      const exportLeads: LeadEmail[] = await res.json();

      if (exportLeads.length === 0) {
        showToast('Không có dữ liệu để xuất!', true);
        return;
      }

      downloadCSV(
        `leads_email_export_${new Date().toISOString().slice(0, 10)}.csv`,
        "Tên Doanh Nghiệp,Email,Website,Trạng thái Email,Từ khóa,Ngày tạo",
        exportLeads.map(lead => [lead.name, lead.email, lead.website, lead.emailStatus, lead.keyword, lead.createdAt])
      );
      showToast('Đã tải xuống file CSV thành công!');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất file CSV!', true);
    }
  };

  const handleExportPhonesCSV = async () => {
    try {
      const queryParams = new URLSearchParams({ search: phones.searchTerm, crawlLogId: selectedLogId });
      const res = await apiFetch(`/api/leads/phones?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu để xuất');
      const exportLeads: LeadPhone[] = await res.json();

      if (exportLeads.length === 0) {
        showToast('Không có dữ liệu để xuất!', true);
        return;
      }

      downloadCSV(
        `leads_phone_export_${new Date().toISOString().slice(0, 10)}.csv`,
        "Tên Doanh Nghiệp,Số điện thoại,Website,Từ khóa,Ngày tạo",
        exportLeads.map(lead => [lead.name, lead.phone, lead.website, lead.keyword, lead.createdAt])
      );
      showToast('Đã tải xuống file CSV thành công!');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất file CSV!', true);
    }
  };

  const handleExportSocialsCSV = async () => {
    try {
      const queryParams = new URLSearchParams({ search: socials.searchTerm, crawlLogId: selectedLogId });
      const res = await apiFetch(`/api/leads/socials?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu để xuất');
      const exportLeads: LeadSocial[] = await res.json();

      if (exportLeads.length === 0) {
        showToast('Không có dữ liệu để xuất!', true);
        return;
      }

      downloadCSV(
        `leads_social_export_${new Date().toISOString().slice(0, 10)}.csv`,
        "Tên Doanh Nghiệp,Nền tảng,Đường dẫn,Website,Từ khóa,Ngày tạo",
        exportLeads.map(lead => [lead.name, SOCIAL_PLATFORM_LABELS[lead.platform] || lead.platform, lead.url, lead.website, lead.keyword, lead.createdAt])
      );
      showToast('Đã tải xuống file CSV thành công!');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất file CSV!', true);
    }
  };

  const crawlLogFilter = (
    <CustomSelect
      value={selectedLogId || "all"}
      onValueChange={(val) => setSelectedLogId(val === "all" ? "" : val)}
      placeholder="-- Lọc theo lần cào --"
      className="w-full sm:w-[260px] shrink-0"
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
            label: `${log.keyword} (${dateStr})`
          };
        })
      ]}
    />
  );

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Top filters and actions */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {crawlLogFilter}

        <Button
          variant="destructive"
          size="md-xl"
          onClick={onClearAll}
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          Xóa tất cả
        </Button>
      </div>

      <Tabs defaultValue="emails">
        <TabsList>
          <TabsTrigger value="emails">Email ({emails.totalCount})</TabsTrigger>
          <TabsTrigger value="phones">Số điện thoại ({phones.totalCount})</TabsTrigger>
          <TabsTrigger value="socials">Mạng xã hội ({socials.totalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-4">
          <LeadDataTab<LeadEmail>
            columns={emailColumns}
            data={emails.data}
            totalCount={emails.totalCount}
            loading={emails.loading}
            keyExtractor={(lead) => lead.id}
            searchTerm={emails.searchTerm}
            onSearchChange={emails.setSearchTerm}
            searchPlaceholder="Lọc theo Tên, Email, Website..."
            emptyState={leadsCount === 0 ? 'Chưa có leads nào. Hãy quét từ khóa ở tab cào.' : 'Không tìm thấy kết quả phù hợp.'}
            currentPage={emails.currentPage}
            totalPages={emails.totalPages}
            pageSize={emails.pageSize}
            onPageChange={emails.goToPage}
            onPageSizeChange={(size) => emails.setPageSize(size)}
            onExportCSV={handleExportEmailsCSV}
            onRowClick={(lead) => handleSelectOne(lead.id, !selectedIds.has(lead.id))}
            rowClassName={(lead) => {
              const isSelected = selectedIds.has(lead.id);
              return `cursor-pointer ${isSelected ? 'bg-primary/[0.03]' : ''}`;
            }}
            totalAllLeadsCount={leadsCount}
            selectedCount={selectedIds.size}
            headerExtra={
              selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="md-xl"
                  onClick={confirmDeleteSelectedEmails}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa đã chọn ({selectedIds.size})
                </Button>
              )
            }
          />
        </TabsContent>

        <TabsContent value="phones" className="mt-4">
          <LeadDataTab<LeadPhone>
            columns={phoneColumns}
            data={phones.data}
            totalCount={phones.totalCount}
            loading={phones.loading}
            keyExtractor={(lead) => lead.id}
            searchTerm={phones.searchTerm}
            onSearchChange={phones.setSearchTerm}
            searchPlaceholder="Lọc theo Tên, Số điện thoại, Website..."
            emptyState="Chưa có số điện thoại nào được tìm thấy."
            currentPage={phones.currentPage}
            totalPages={phones.totalPages}
            pageSize={phones.pageSize}
            onPageChange={phones.goToPage}
            onPageSizeChange={(size) => phones.setPageSize(size)}
            onExportCSV={handleExportPhonesCSV}
            onRowClick={(lead) => handleSelectOnePhone(lead.id, !selectedPhoneIds.has(lead.id))}
            rowClassName={(lead) => {
              const isSelected = selectedPhoneIds.has(lead.id);
              return `cursor-pointer ${isSelected ? 'bg-primary/[0.03]' : ''}`;
            }}
            selectedCount={selectedPhoneIds.size}
            headerExtra={
              selectedPhoneIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="md-xl"
                  onClick={confirmDeleteSelectedPhones}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa đã chọn ({selectedPhoneIds.size})
                </Button>
              )
            }
          />
        </TabsContent>

        <TabsContent value="socials" className="mt-4">
          <LeadDataTab<LeadSocial>
            columns={socialColumns}
            data={socials.data}
            totalCount={socials.totalCount}
            loading={socials.loading}
            keyExtractor={(lead) => lead.id}
            searchTerm={socials.searchTerm}
            onSearchChange={socials.setSearchTerm}
            searchPlaceholder="Lọc theo Tên, Nền tảng, URL, Website..."
            emptyState="Chưa có mạng xã hội nào được tìm thấy."
            currentPage={socials.currentPage}
            totalPages={socials.totalPages}
            pageSize={socials.pageSize}
            onPageChange={socials.goToPage}
            onPageSizeChange={(size) => socials.setPageSize(size)}
            onExportCSV={handleExportSocialsCSV}
            onRowClick={(lead) => handleSelectOneSocial(lead.id, !selectedSocialIds.has(lead.id))}
            rowClassName={(lead) => {
              const isSelected = selectedSocialIds.has(lead.id);
              return `cursor-pointer ${isSelected ? 'bg-primary/[0.03]' : ''}`;
            }}
            selectedCount={selectedSocialIds.size}
            headerExtra={
              selectedSocialIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="md-xl"
                  onClick={confirmDeleteSelectedSocials}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa đã chọn ({selectedSocialIds.size})
                </Button>
              )
            }
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteConfirm.show}
        onOpenChange={(show) => setDeleteConfirm(prev => ({ ...prev, show }))}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
        onConfirm={deleteConfirm.onConfirm}
        variant="destructive"
      />
    </div>
  );
}
