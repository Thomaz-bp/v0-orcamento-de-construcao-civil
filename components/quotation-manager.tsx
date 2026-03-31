'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/status-badge'
import { Plus, Check, Loader2, Star, Trash2, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Supplier {
  id: string
  company_name: string
  location_uf: string | null
  location_city: string | null
}

interface Quotation {
  id: string
  supplier_id: string
  unit_price: number
  quantity: number
  freight_value: number
  total_landed_cost: number | null
  lead_time_days: number | null
  selected: boolean
  suppliers: Supplier
}

interface RfqItem {
  id: string
  quantity: number
  unit: string
  material_id: string
  materials: {
    id: string
    description: string
    internal_code: string | null
    family: string
  }
  requirements: {
    id: string
    generic_item: string
  }
  quotations: Quotation[]
}

interface QuotationManagerProps {
  rfqId: string
  rfqItems: RfqItem[]
  suppliers: Supplier[]
  projectLocation: {
    uf: string | null
    city: string | null
  }
}

export function QuotationManager({
  rfqId,
  rfqItems,
  suppliers,
  projectLocation,
}: QuotationManagerProps) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<RfqItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: '',
    unit_price: '',
    quantity: '',
    freight_value: '0',
    lead_time_days: '7',
  })

  const handleAddQuotation = useCallback(async () => {
    if (!selectedItem || !formData.supplier_id || !formData.unit_price) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_item_id: selectedItem.id,
          supplier_id: formData.supplier_id,
          unit_price: parseFloat(formData.unit_price),
          quantity: parseFloat(formData.quantity) || selectedItem.quantity,
          freight_value: parseFloat(formData.freight_value) || 0,
          lead_time_days: parseInt(formData.lead_time_days) || 7,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao adicionar cotação')
      }

      setDialogOpen(false)
      setSelectedItem(null)
      setFormData({
        supplier_id: '',
        unit_price: '',
        quantity: '',
        freight_value: '0',
        lead_time_days: '7',
      })
      router.refresh()
    } catch (error) {
      console.error('Error adding quotation:', error)
      alert('Erro ao adicionar cotação')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedItem, formData, router])

  const handleSelectQuotation = useCallback(async (quotationId: string, itemId: string) => {
    try {
      const response = await fetch('/api/quotations/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId, rfqItemId: itemId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao selecionar cotação')
      }

      router.refresh()
    } catch (error) {
      console.error('Error selecting quotation:', error)
    }
  }, [router])

  const handleDeleteQuotation = useCallback(async (quotationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cotação?')) return

    setIsDeleting(quotationId)
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir cotação')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting quotation:', error)
      alert('Erro ao excluir cotação')
    } finally {
      setIsDeleting(null)
    }
  }, [router])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const openAddDialog = (item: RfqItem) => {
    setSelectedItem(item)
    setFormData(prev => ({
      ...prev,
      quantity: item.quantity.toString(),
    }))
    setDialogOpen(true)
  }

  // Calculate totals
  const totalItems = rfqItems.length
  const itemsWithQuotations = rfqItems.filter(item => item.quotations?.length > 0).length
  const itemsWithSelection = rfqItems.filter(item => item.quotations?.some(q => q.selected)).length

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Itens e Cotações
          </CardTitle>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{itemsWithQuotations}/{totalItems} cotados</span>
            <span>{itemsWithSelection}/{totalItems} selecionados</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Material</th>
                <th className="w-[100px] px-3 py-2 text-left font-medium">Qtd</th>
                <th className="px-3 py-2 text-left font-medium">Cotações Recebidas</th>
                <th className="w-[120px] px-3 py-2 text-left font-medium">Melhor Preço</th>
                <th className="w-[80px] px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rfqItems.map((item) => {
                const selectedQuotation = item.quotations?.find(q => q.selected)
                const bestQuotation = item.quotations?.length > 0
                  ? item.quotations.reduce((min, q) => 
                      (q.total_landed_cost || q.unit_price * q.quantity) < (min.total_landed_cost || min.unit_price * min.quantity)
                        ? q : min
                    )
                  : null

                return (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-medium">{item.materials.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.materials.internal_code} | {item.materials.family}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-3 py-3">
                      {item.quotations?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.quotations.map((quotation) => (
                            <div
                              key={quotation.id}
                              className={`group flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                                quotation.selected 
                                  ? 'border-success bg-success/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">{quotation.suppliers.company_name}</p>
                                <p className="text-muted-foreground">
                                  {formatCurrency(quotation.unit_price)}/un
                                  {quotation.freight_value > 0 && ` + ${formatCurrency(quotation.freight_value)} frete`}
                                </p>
                                {quotation.lead_time_days && (
                                  <p className="text-muted-foreground">{quotation.lead_time_days} dias</p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                {quotation.selected ? (
                                  <Star className="h-4 w-4 fill-success text-success" />
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleSelectQuotation(quotation.id, item.id)}
                                    title="Selecionar"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleDeleteQuotation(quotation.id)}
                                  disabled={isDeleting === quotation.id}
                                  title="Excluir"
                                >
                                  {isDeleting === quotation.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem cotações</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {bestQuotation && (
                        <span className="font-medium text-success">
                          {formatCurrency(bestQuotation.total_landed_cost || bestQuotation.unit_price * bestQuotation.quantity)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddDialog(item)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Cotação
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {rfqItems.map((item) => {
            const bestQuotation = item.quotations?.length > 0
              ? item.quotations.reduce((min, q) => 
                  (q.total_landed_cost || q.unit_price * q.quantity) < (min.total_landed_cost || min.unit_price * min.quantity)
                    ? q : min
                )
              : null

            return (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{item.materials.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} | {item.materials.family}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog(item)}
                    className="h-7 shrink-0 px-2 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Cotação
                  </Button>
                </div>

                {item.quotations?.length > 0 ? (
                  <div className="space-y-2">
                    {item.quotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className={`flex items-center justify-between gap-2 rounded-md border p-2 ${
                          quotation.selected 
                            ? 'border-success bg-success/10' 
                            : 'border-border'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{quotation.suppliers.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(quotation.unit_price)}/un
                            {quotation.freight_value > 0 && ` + ${formatCurrency(quotation.freight_value)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {quotation.selected ? (
                            <Star className="h-4 w-4 fill-success text-success" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleSelectQuotation(quotation.id, item.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            disabled={isDeleting === quotation.id}
                          >
                            {isDeleting === quotation.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    Sem cotações recebidas
                  </p>
                )}

                {bestQuotation && (
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-muted-foreground">Melhor preço:</span>
                    <span className="font-medium text-success">
                      {formatCurrency(bestQuotation.total_landed_cost || bestQuotation.unit_price * bestQuotation.quantity)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Quotation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Cotação</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="grid gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium text-sm">{selectedItem.materials.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Quantidade: {selectedItem.quantity} {selectedItem.unit}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Fornecedor *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.company_name}
                          {s.location_uf && ` (${s.location_city}/${s.location_uf})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Preço Unitário (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Frete (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.freight_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, freight_value: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Lead Time (dias)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.lead_time_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddQuotation} 
                  disabled={isSubmitting || !formData.supplier_id || !formData.unit_price}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar Cotação
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
