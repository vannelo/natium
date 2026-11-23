import { cn } from '@/shared/utils/cn'

export interface TabItem<K extends string> {
  key: K
  label: string
  count?: number
}

export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem<K>[]
  value: K
  onChange: (k: K) => void
}) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-ice-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
            value === t.key
              ? 'border-aqua text-navy'
              : 'border-transparent text-steel-600 hover:text-navy',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="tnum rounded-full bg-ice px-1.5 py-0.5 text-[11px] text-steel-800">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
