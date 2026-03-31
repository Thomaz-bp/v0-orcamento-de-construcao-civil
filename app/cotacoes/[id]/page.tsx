import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { 
  ArrowLeft, 
  Package,
  Truck,
  DollarSign,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { QuotationManager } from '@/components/quotation-manager'
import { RfqActions } from '@/components/rfq-actions'

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
    .select('id, company_name, email, location_uf, location_city')
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
  const itemsWithSelection = rfq.rfq_items?.filter(
    (item: { quotations: { selected: boolean }[] }) => item.quotations?.some(q => q.selected)
  ).length || 0

  // Calculate total value of selected quotations
  const totalSelectedValue = rfq.rfq_items?.reduce((total: number, item: { quotations: { selected: boolean; total_landed_cost: number | null; unit_price: number; quantity: number }[] }) => {
    const selectedQuotation = item.quotations?.find(q => q.selected)
    if (selectedQuotation) {
      return total + (selectedQuotation.total_landed_cost || selectedQuotation.unit_price * selectedQuotation.quantity)
    }
    return total
  }, 0) || 0

  return (
    <AppShell>
      <PageHeader
        title={rfq.title}
        description={`${rfq.projects?.name} - ${rfq.projects?.client_name || 'Sem cliente'}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={getRfqStatusVariant(rfq.status)}>
            {getRfqStatusLabel(rfq.status)}
          </StatusBadge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cotacoes">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Actions */}
        <RfqActions 
          rfqId={rfq.id} 
          rfqStatus={rfq.status}
          suppliers={suppliers}
          canClose={itemsWithSelection === totalItems && totalItems > 0}
          projectId={rfq.projects?.id}
        />

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
              <div className="rounded-lg bg-muted p-1.5 sm:p-2">
                <Package className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold sm:text-2xl">{totalItems}</p>
                <p className="truncate text-xs text-muted-foreground">Itens</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
              <div className="rounded-lg bg-info/20 p-1.5 sm:p-2">
                <DollarSign className="h-4 w-4 text-info sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold sm:text-2xl">{itemsWithQuotations}</p>
                <p className="truncate text-xs text-muted-foreground">Com cotação</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
              <div className="rounded-lg bg-success/20 p-1.5 sm:p-2">
                <CheckCircle className="h-4 w-4 text-success sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold sm:text-2xl">{itemsWithSelection}</p>
                <p className="truncate text-xs text-muted-foreground">Selecionados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
              <div className="rounded-lg bg-warning/20 p-1.5 sm:p-2">
                <Calendar className="h-4 w-4 text-warning sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold sm:text-2xl">
                  {rfq.deadline 
                    ? new Date(rfq.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    : '-'
                  }
                </p>
                <p className="truncate text-xs text-muted-foreground">Prazo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Value Card */}
        {totalSelectedValue > 0 && (
          <Card className="mb-4 border-success/50 bg-success/5 sm:mb-6">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/20 p-2">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total Selecionado</p>
                  <p className="text-xl font-bold text-success sm:text-2xl">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalSelectedValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {rfq.notes && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-sm font-medium">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
