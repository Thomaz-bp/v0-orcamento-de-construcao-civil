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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { Plus, Check, Loader2, Star } from 'lucide-react'
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Itens e Cotações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Material</TableHead>
                <TableHead className="w-[100px]">Qtd</TableHead>
                <TableHead>Cotações Recebidas</TableHead>
                <TableHead className="w-[100px]">Melhor Preço</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqItems.map((item) => {
                const selectedQuotation = item.quotations?.find(q => q.selected)
                const bestQuotation = item.quotations?.length > 0
                  ? item.quotations.reduce((min, q) => 
                      (q.total_landed_cost || q.unit_price * q.quantity) < (min.total_landed_cost || min.unit_price * min.quantity)
                        ? q : min
                    )
                  : null

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.materials.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.materials.internal_code} | {item.materials.family}
                      </p>
                    </TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      {item.quotations?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.quotations.map((quotation) => (
                            <div
                              key={quotation.id}
                              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                                quotation.selected ? 'border-success bg-success/10' : 'border-border'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{quotation.suppliers.company_name}</p>
                                <p className="text-muted-foreground">
                                  {formatCurrency(quotation.unit_price)}/un
                                  {quotation.freight_value > 0 && ` + ${formatCurrency(quotation.freight_value)} frete`}
                                </p>
                              </div>
                              {!quotation.selected && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleSelectQuotation(quotation.id, item.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {quotation.selected && (
                                <Star className="h-4 w-4 fill-success text-success" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem cotações</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bestQuotation && (
                        <span className="font-medium text-success">
                          {formatCurrency(bestQuotation.total_landed_cost || bestQuotation.unit_price * bestQuotation.quantity)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setFormData(prev => ({
                                ...prev,
                                quantity: item.quantity.toString(),
                              }))
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Cotação
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Cotação</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div className="rounded-lg bg-muted p-3">
                              <p className="font-medium">{item.materials.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantidade: {item.quantity} {item.unit}
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

                            <Button onClick={handleAddQuotation} disabled={isSubmitting}>
                              {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              Adicionar Cotação
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
