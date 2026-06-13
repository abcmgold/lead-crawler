import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface UseLeadListDataOptions {
  /** API endpoint to fetch from, e.g. '/api/leads/emails' */
  endpoint: string;
  /** Bumped by the parent whenever a new crawl finishes, to trigger a refetch */
  leadsVersion?: number;
  /** Optional crawl log id to scope the results to a single crawl session */
  crawlLogId?: string;
  /** When false, skips fetching entirely (e.g. while a modal is closed) */
  enabled?: boolean;
}

interface UseLeadListDataResult<T> {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  data: T[];
  totalCount: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  goToPage: (page: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function useLeadListData<T>({ endpoint, leadsVersion = 0, crawlLogId = '', enabled = true }: UseLeadListDataOptions): UseLeadListDataResult<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [crawlLogId]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
          search: searchQuery,
          crawlLogId
        });
        const res = await apiFetch(`${endpoint}?${queryParams.toString()}`);
        if (res.ok && active) {
          const json = await res.json();
          setData(json.leads || []);
          setTotalCount(json.total || 0);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [endpoint, currentPage, pageSize, searchQuery, crawlLogId, leadsVersion, enabled]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return {
    searchTerm,
    setSearchTerm,
    data,
    totalCount,
    loading,
    currentPage: safePage,
    pageSize,
    setPageSize,
    totalPages,
    goToPage
  };
}

export { PAGE_SIZE_OPTIONS };
