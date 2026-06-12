import * as React from "react"
import { ChevronFirst, ChevronLast } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomSelect } from "./select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

export interface Column<T> {
  id?: string
  header: React.ReactNode
  accessor: (row: T, index: number) => React.ReactNode
  className?: string
  cellClassName?: string
  /** Fixed column width in px. With scrollableBody, the table becomes at least the sum of all column widths and scrolls horizontally if that's wider than its container. */
  width?: number
}

export function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = []
  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages)
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
  }
  return pages
}

export interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  /** Label for the counted items, e.g. "leads", "phiên quét". Defaults to "mục". */
  itemLabel?: string
  /** Optional overall total count of records to compute "lọc từ X" dynamically */
  totalAllLeadsCount?: number
  /** Optional number of selected items, shows "Đã chọn: X" if provided */
  selectedCount?: number
  /** Optional page size options, shows page size dropdown if provided */
  pageSizeOptions?: readonly number[] | number[]
  /** Optional handler when page size is changed */
  onPageSizeChange?: (pageSize: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  onRowClick?: (row: T, index: number) => void
  rowClassName?: string | ((row: T, index: number) => string)
  emptyState?: React.ReactNode
  className?: string
  containerClassName?: string
  wrapperClassName?: string
  /** When true, the header stays fixed and only the body scrolls (its own scrollbar). */
  scrollableBody?: boolean
  /** When provided, renders a pagination bar below the table. */
  pagination?: DataTablePaginationProps
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  emptyState = "Không có dữ liệu.",
  className,
  containerClassName,
  wrapperClassName,
  scrollableBody = false,
  pagination,
}: DataTableProps<T>) {
  // With a scrollable body, each <tr> becomes its own fixed-layout mini-table
  // so header and body columns line up even though they're separate tables.
  const rowLayoutClass = scrollableBody ? "table table-fixed w-full" : undefined
  const showPagination = pagination && (pagination.totalPages > 1 || pagination.totalCount > 0)
  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.pageSize : 0

  const finalContainerClassName = cn(
    "rounded-xl border border-white/5 bg-slate-950/20 overflow-hidden",
    scrollableBody && "flex flex-col flex-1 min-h-0",
    containerClassName
  )

  const finalWrapperClassName = cn(
    scrollableBody && "flex-1 min-h-0",
    wrapperClassName
  )

  // Sum of explicit column widths drives the table's min-width so it keeps
  // each column's exact size and scrolls horizontally once they no longer fit.
  const totalColumnsWidth = columns.reduce((sum, column) => sum + (column.width ?? 0), 0)
  const minBodyWidth = totalColumnsWidth > 0 ? `${totalColumnsWidth}px` : undefined

  return (
    <div className={finalContainerClassName}>
      <Table className={className} wrapperClassName={finalWrapperClassName} scrollableBody={scrollableBody} minBodyWidth={scrollableBody ? minBodyWidth : undefined}>
        <TableHeader className={cn(
          "bg-slate-900/95 border-b border-white/5 [&_tr]:border-b-0",
          scrollableBody ? "block w-full shrink-0" : "sticky top-0 z-10"
        )}>
          <TableRow className={cn("hover:bg-transparent border-0", rowLayoutClass)}>
            {columns.map((column, idx) => (
              <TableHead
                key={column.id || idx}
                className={column.className}
                style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={cn(scrollableBody && "block w-full flex-1 overflow-y-scroll overscroll-contain min-h-0")}>
          {data.length === 0 ? (
            <TableRow className={cn("hover:bg-transparent border-0", rowLayoutClass)}>
              <TableCell
                colSpan={columns.length}
                className="text-center py-10 text-slate-500 font-mono"
              >
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIdx) => {
              const rowClass = typeof rowClassName === "function"
                ? rowClassName(row, rowIdx)
                : rowClassName

              return (
                <TableRow
                  key={keyExtractor(row, rowIdx)}
                  onClick={onRowClick ? () => onRowClick(row, rowIdx) : undefined}
                  className={cn(rowClass, rowLayoutClass)}
                >
                  {columns.map((column, colIdx) => {
                    const content = column.accessor(row, rowIdx)
                    const isPrimitive = typeof content === "string" || typeof content === "number"
                    return (
                      <TableCell
                        key={column.id || colIdx}
                        className={column.cellClassName}
                        style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
                      >
                        {isPrimitive ? (
                          <div className="truncate max-w-[180px] sm:max-w-[240px] block font-sans" title={String(content)}>
                            {content}
                          </div>
                        ) : (
                          content
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {showPagination && pagination && (
        <div className={cn(
          "px-4 py-3 bg-slate-950/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3",
          scrollableBody && "shrink-0"
        )}>
          <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {pagination.totalCount > 0 && (
              <span>
                Hiển thị <span className="text-white font-semibold">{startIndex + 1}–{Math.min(startIndex + pagination.pageSize, pagination.totalCount)}</span>
                {' / '}
                <span className="text-white font-semibold">{pagination.totalCount}</span>
                {` ${pagination.itemLabel ?? "mục"}`}
                {pagination.totalAllLeadsCount !== undefined && pagination.totalAllLeadsCount > 0 && pagination.totalCount < pagination.totalAllLeadsCount && (
                  <span className="text-slate-500"> (lọc từ {pagination.totalAllLeadsCount})</span>
                )}
              </span>
            )}
            
            {pagination.selectedCount !== undefined && (
              <span className="text-primary font-semibold">Đã chọn: {pagination.selectedCount}</span>
            )}

            {pagination.pageSizeOptions && pagination.onPageSizeChange && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-slate-500 whitespace-nowrap">Hiển thị:</span>
                <CustomSelect
                  value={String(pagination.pageSize)}
                  onValueChange={(val) => pagination.onPageSizeChange?.(Number(val))}
                  triggerClassName="bg-slate-950/60 border border-white/10 text-slate-300 rounded-lg px-2 py-1 text-xs font-mono w-16 h-7 focus:ring-0"
                  contentClassName="w-20"
                  options={pagination.pageSizeOptions.map(n => ({
                    value: String(n),
                    label: String(n)
                  }))}
                  openDirection="up"
                />
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination className="w-auto mx-0">
              <PaginationContent className="gap-0.5">
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); pagination.onPageChange(1); }}
                    aria-disabled={pagination.currentPage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${pagination.currentPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                    aria-label="First page"
                  >
                    <ChevronFirst className="w-4 h-4" />
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationPrevious
                    text="Trước"
                    href="#"
                    onClick={(e) => { e.preventDefault(); pagination.onPageChange(pagination.currentPage - 1); }}
                    aria-disabled={pagination.currentPage === 1}
                    className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${pagination.currentPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                </PaginationItem>

                {getPageNumbers(pagination.currentPage, pagination.totalPages).map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="text-slate-500 w-8 h-8" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`page-${page}`}>
                      <PaginationLink
                        href="#"
                        isActive={page === pagination.currentPage}
                        onClick={(e) => { e.preventDefault(); pagination.onPageChange(page); }}
                        className={`w-8 h-8 text-xs rounded-lg border-0 transition-all ${page === pagination.currentPage
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
                    onClick={(e) => { e.preventDefault(); pagination.onPageChange(pagination.currentPage + 1); }}
                    aria-disabled={pagination.currentPage === pagination.totalPages}
                    className={`text-xs h-8 rounded-lg border-0 text-slate-400 hover:text-white hover:bg-white/5 transition-all ${pagination.currentPage === pagination.totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); pagination.onPageChange(pagination.totalPages); }}
                    aria-disabled={pagination.currentPage === pagination.totalPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border-0 transition-all text-slate-400 hover:text-white hover:bg-white/5 ${pagination.currentPage === pagination.totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                    aria-label="Last page"
                  >
                    <ChevronLast className="w-4 h-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}
