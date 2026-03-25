import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
      className
    )}>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
