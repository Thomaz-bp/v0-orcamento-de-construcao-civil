import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface StatusBadgeProps {
  variant?: StatusVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-destructive/20 text-destructive',
  info: 'bg-info/20 text-info',
}

export function StatusBadge({ variant = 'default', children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Helper para mapear status do projeto para variant
export function getProjectStatusVariant(status: string): StatusVariant {
  const mapping: Record<string, StatusVariant> = {
    draft: 'default',
    in_progress: 'info',
    quoting: 'warning',
    budgeting: 'warning',
    completed: 'success',
    cancelled: 'error',
  }
  return mapping[status] || 'default'
}

export function getProjectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    in_progress: 'Em Andamento',
    quoting: 'Cotação',
    budgeting: 'Orçamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}

export function getRequirementStatusVariant(status: string): StatusVariant {
  const mapping: Record<string, StatusVariant> = {
    pending: 'warning',
    matched: 'info',
    approved: 'success',
    rejected: 'error',
  }
  return mapping[status] || 'default'
}

export function getRequirementStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    matched: 'Associado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  }
  return labels[status] || status
}
