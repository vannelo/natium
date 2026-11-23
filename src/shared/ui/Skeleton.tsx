import { cn } from '@/shared/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-ice-200 bg-white p-5">
      <Skeleton className="mb-4 h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-4 w-full last:mb-0" />
      ))}
    </div>
  )
}
