import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Send, 
  ArrowRight,
  Calendar,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/status-badge'

async function getRfqs() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('rfqs')
    .select(`
      *,
      projects(name, client_name),
      rfq_items(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching RFQs:', error)
    return []
  }

  return data
}

function getRfqStatusVariant(status: string) {
  const variants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
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

export default async function CotacoesPage() {
  const rfqs = await getRfqs()

  return (
    <AppShell>
      <PageHeader
        title="Cotações"
        description="Solicitações de cotação"
      >
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/cotacoes/nova">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova RFQ</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {rfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
            <Send className="mb-4 h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
            <h3 className="mb-1 text-base font-medium text-foreground sm:text-lg">
              Nenhuma cotação criada
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Crie uma RFQ para solicitar cotações de fornecedores.
            </p>
            <Button asChild>
              <Link href="/cotacoes/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova RFQ
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rfqs.map((rfq) => (
              <Card key={rfq.id} className="transition-colors hover:border-primary/50">
                <CardHeader className="p-4 pb-2 sm:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                      {rfq.title}
                    </CardTitle>
                    <StatusBadge variant={getRfqStatusVariant(rfq.status)} className="shrink-0 text-xs">
                      {getRfqStatusLabel(rfq.status)}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    <p className="truncate font-medium text-foreground">
                      {rfq.projects?.name}
                    </p>
                    {rfq.projects?.client_name && (
                      <p className="truncate">{rfq.projects.client_name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
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
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end border-t border-border pt-3 sm:mt-4 sm:pt-4">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                      <Link href={`/cotacoes/${rfq.id}`}>
                        Gerenciar
                        <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
