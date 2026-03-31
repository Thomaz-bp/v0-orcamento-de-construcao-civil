import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { 
  Send, 
  Plus, 
  ArrowRight,
  Calendar,
  Package,
} from 'lucide-react'
import Link from 'next/link'

interface Rfq {
  id: string
  title: string
  status: string
  deadline: string | null
  created_at: string
  rfq_items?: { count: number }[]
}

interface ProjectRfqsTabProps {
  projectId: string
  rfqs: Rfq[]
}

function getRfqStatusVariant(status: string) {
  const variants: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
    draft: 'default',
    sent: 'info',
    collecting: 'warning',
    closed: 'success',
  }
  return variants[status] || 'default'
}

function getRfqStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    collecting: 'Coletando',
    closed: 'Fechada',
  }
  return labels[status] || status
}

export function ProjectRfqsTab({ projectId, rfqs }: ProjectRfqsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 sm:p-6">
        <CardTitle className="text-base">Solicitações de Cotação (RFQ)</CardTitle>
        <Button size="sm" asChild>
          <Link href={`/projetos/${projectId}/cotacoes/nova`}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova RFQ</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {rfqs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Send className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>Nenhuma cotação criada ainda.</p>
            <p className="text-sm">Crie uma RFQ após aprovar os requisitos.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {rfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="flex flex-col rounded-lg border border-border p-3 transition-colors hover:border-primary/50 sm:p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h4 className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                    {rfq.title}
                  </h4>
                  <StatusBadge variant={getRfqStatusVariant(rfq.status)} className="shrink-0 text-xs">
                    {getRfqStatusLabel(rfq.status)}
                  </StatusBadge>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {rfq.rfq_items?.[0]?.count || 0} itens
                  </span>
                  {rfq.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(rfq.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span>
                    Criada em {new Date(rfq.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="mt-auto flex justify-end border-t border-border pt-3">
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                    <Link href={`/cotacoes/${rfq.id}`}>
                      Gerenciar
                      <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
