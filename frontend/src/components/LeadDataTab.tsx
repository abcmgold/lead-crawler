import React from 'react';
import { Download, Search } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PAGE_SIZE_OPTIONS } from '@/hooks/useLeadListData';

interface LeadDataTabProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  loading: boolean;
  keyExtractor: (row: T) => string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  emptyState: React.ReactNode;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onExportCSV?: () => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  headerExtra?: React.ReactNode;
  totalAllLeadsCount?: number;
  selectedCount?: number;
}

export function LeadDataTab<T>({
  columns,
  data,
  totalCount,
  loading,
  keyExtractor,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  emptyState,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExportCSV,
  onRowClick,
  rowClassName,
  headerExtra,
  totalAllLeadsCount,
  selectedCount,
}: LeadDataTabProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </span>
          <Input
            type="text"
            className="pl-11"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {headerExtra}
          {onExportCSV && (
            <Button variant="outline" size="md-xl" onClick={onExportCSV}>
              <Download className="w-4 h-4" />
              Xuất CSV
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        emptyState={emptyState}
        containerClassName="relative w-full overflow-x-auto glass-panel rounded-2xl shadow-xl border border-white/5"
        className="w-full text-sm text-left text-slate-300 border-collapse"
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange,
          itemLabel: "kết quả",
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageSizeChange,
          totalAllLeadsCount,
          selectedCount
        }}
      />
    </div>
  );
}
