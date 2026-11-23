import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  /** Hide on small screens. */
  hideOnMobile?: boolean
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  loading?: boolean
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
  dense?: boolean
}

/** Responsive, accessible table. Hides secondary columns on mobile instead of overflowing. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyState,
  onRowClick,
  dense,
}: DataTableProps<T>) {
  const pad = dense ? 'px-3 py-2' : 'px-4 py-3'
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-ice-200 bg-white">
      <table className="w-full min-w-0 border-collapse text-sm">
        <thead>
          <tr className="border-b border-ice-200 bg-ice/60">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  pad,
                  'text-left text-[11px] font-bold tracking-wider text-steel-800 uppercase',
                  c.hideOnMobile && 'hidden md:table-cell',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b border-ice-200 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={cn(pad, c.hideOnMobile && 'hidden md:table-cell')}>
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {emptyState ?? (
                  <div className="p-8 text-center text-sm text-steel-600">Sin registros.</div>
                )}
              </td>
            </tr>
          )}
          {!loading &&
            rows?.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-ice-200 transition-colors last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-ice/60',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      pad,
                      'align-middle text-navy',
                      c.hideOnMobile && 'hidden md:table-cell',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
