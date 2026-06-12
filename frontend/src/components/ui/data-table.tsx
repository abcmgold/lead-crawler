import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export interface Column<T> {
  id?: string
  header: React.ReactNode
  accessor: (row: T, index: number) => React.ReactNode
  className?: string
  cellClassName?: string
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
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  emptyState = "Không có dữ liệu.",
  className,
  containerClassName = "rounded-xl border border-white/5 bg-slate-950/20 overflow-hidden",
}: DataTableProps<T>) {
  return (
    <div className={containerClassName}>
      <Table className={className}>
        <TableHeader className="bg-slate-900/60 border-b border-white/5 [&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent border-0">
            {columns.map((column, idx) => (
              <TableHead
                key={column.id || idx}
                className={column.className}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent border-0">
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
                  className={rowClass}
                >
                  {columns.map((column, colIdx) => {
                    const content = column.accessor(row, rowIdx)
                    const isPrimitive = typeof content === "string" || typeof content === "number"
                    return (
                      <TableCell
                        key={column.id || colIdx}
                        className={column.cellClassName}
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
    </div>
  )
}
