import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
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
        description="Gerenciar solicitações de cotação (RFQs)"
      >
        <Button asChild>
          <Link href="/cotacoes/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova RFQ
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {rfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Send className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-medium text-foreground">
              Nenhuma cotação criada
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rfqs.map((rfq) => (
              <Card key={rfq.id} className="transition-colors hover:border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium">
                      {rfq.title}
                    </CardTitle>
                    <StatusBadge variant={getRfqStatusVariant(rfq.status)}>
                      {getRfqStatusLabel(rfq.status)}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {rfq.projects?.name}
                    </p>
                    {rfq.projects?.client_name && (
                      <p>{rfq.projects.client_name}</p>
                    )}
                    <div className="flex items-center gap-4">
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
                  
                  <div className="mt-4 flex justify-end border-t border-border pt-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cotacoes/${rfq.id}`}>
                        Gerenciar
                        <ArrowRight className="ml-2 h-4 w-4" />
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
