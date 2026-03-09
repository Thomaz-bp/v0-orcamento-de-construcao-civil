import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { 
  ArrowLeft, 
  Send, 
  Plus,
  Package,
  Truck,
  DollarSign,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { QuotationManager } from '@/components/quotation-manager'

async function getRfqData(id: string) {
  const supabase = await createClient()

  const { data: rfq, error } = await supabase
    .from('rfqs')
    .select(`
      *,
      projects(id, name, client_name, location_uf, location_city),
      rfq_items(
        id,
        quantity,
        unit,
        material_id,
        requirement_id,
        materials(id, description, internal_code, family),
        requirements(id, generic_item),
        quotations(
          id,
          supplier_id,
          unit_price,
          quantity,
          freight_value,
          total_landed_cost,
          lead_time_days,
          selected,
          suppliers(id, company_name, location_uf, location_city)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !rfq) {
    return null
  }

  // Get all suppliers for adding quotations
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, company_name, location_uf, location_city')
    .eq('active', true)
    .order('company_name')

  return { rfq, suppliers: suppliers || [] }
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

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getRfqData(id)

  if (!data) {
    notFound()
  }

  const { rfq, suppliers } = data

  const totalItems = rfq.rfq_items?.length || 0
  const itemsWithQuotations = rfq.rfq_items?.filter(
    (item: { quotations: unknown[] }) => item.quotations?.length > 0
  ).length || 0

  return (
    <AppShell>
      <PageHeader
        title={rfq.title}
        description={`${rfq.projects?.name} - ${rfq.projects?.client_name || 'Sem cliente'}`}
      >
        <StatusBadge variant={getRfqStatusVariant(rfq.status)} className="mr-2">
          {getRfqStatusLabel(rfq.status)}
        </StatusBadge>
        <Button variant="outline" size="sm" asChild>
          <Link href="/cotacoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Itens</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-success/20 p-2">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{itemsWithQuotations}</p>
                <p className="text-xs text-muted-foreground">Com cotação</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-warning/20 p-2">
                <Truck className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-info/20 p-2">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {rfq.deadline 
                    ? new Date(rfq.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    : '-'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Prazo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {rfq.notes && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rfq.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Quotation Manager */}
        <QuotationManager 
          rfqId={rfq.id}
          rfqItems={rfq.rfq_items || []}
          suppliers={suppliers}
          projectLocation={{
            uf: rfq.projects?.location_uf,
            city: rfq.projects?.location_city,
          }}
        />
      </div>
    </AppShell>
  )
}
