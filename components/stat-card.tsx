import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-3 sm:p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
          <p className="mt-0.5 text-xl font-semibold text-card-foreground sm:mt-1 sm:text-2xl">{value}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'mt-1.5 text-xs font-medium sm:mt-2',
              trend.value >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className="shrink-0 rounded-lg bg-muted p-1.5 sm:p-2">
            <Icon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
