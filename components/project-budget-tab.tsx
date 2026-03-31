'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calculator, 
  Loader2, 
  RefreshCw,
  DollarSign,
  Percent,
  Package,
  FileDown,
} from 'lucide-react'

interface BudgetItem {
  id: string
  quantity: number
  unit_cost: number
  total_cost: number
  margin_applied: number
  final_price: number
  materials: {
    description: string
    internal_code: string | null
    unit: string
  }
  requirements: {
    generic_item: string
  }
}

interface ProjectBudgetTabProps {
  projectId: string
  hasClosedRfqs: boolean
  bdiPercentage: number
  marginPercentage: number
}

export function ProjectBudgetTab({
  projectId,
  hasClosedRfqs,
  bdiPercentage,
  marginPercentage,
}: ProjectBudgetTabProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalCost: 0,
    totalFinalPrice: 0,
    bdiValue: 0,
    grandTotal: 0,
  })

  useEffect(() => {
    loadBudgetItems()
  }, [projectId])

  const loadBudgetItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/budget?projectId=${projectId}`)
      const data = await response.json()
      
      if (data.items) {
        setBudgetItems(data.items)
        
        const totalCost = data.items.reduce((sum: number, item: BudgetItem) => sum + item.total_cost, 0)
        const totalFinalPrice = data.items.reduce((sum: number, item: BudgetItem) => sum + item.final_price, 0)
        const bdiValue = totalFinalPrice * (bdiPercentage / 100)
        
        setSummary({
          totalCost,
          totalFinalPrice,
          bdiValue,
          grandTotal: totalFinalPrice + bdiValue,
        })
      }
    } catch (error) {
      console.error('Error loading budget items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateBudget = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/budget/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar orçamento')
      }

      await loadBudgetItems()
      router.refresh()
    } catch (error) {
      console.error('Error generating budget:', error)
      alert(error instanceof Error ? error.message : 'Erro ao gerar orçamento')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (budgetItems.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 sm:p-6">
          <CardTitle className="text-base">Orçamento Consolidado</CardTitle>
          <Button 
            size="sm" 
            onClick={handleGenerateBudget}
            disabled={!hasClosedRfqs || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            Gerar Orçamento
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="py-8 text-center text-muted-foreground">
            <Calculator className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>Orçamento ainda não gerado.</p>
            <p className="text-sm">
              {hasClosedRfqs 
                ? 'Clique em "Gerar Orçamento" para consolidar as cotações.'
                : 'Feche pelo menos uma cotação para gerar o orçamento.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="rounded-lg bg-muted p-1.5 sm:p-2">
              <Package className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold sm:text-2xl">{budgetItems.length}</p>
              <p className="truncate text-xs text-muted-foreground">Itens</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="rounded-lg bg-muted p-1.5 sm:p-2">
              <DollarSign className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-lg">{formatCurrency(summary.totalCost)}</p>
              <p className="truncate text-xs text-muted-foreground">Custo Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="rounded-lg bg-info/20 p-1.5 sm:p-2">
              <Percent className="h-4 w-4 text-info sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-lg">{formatCurrency(summary.bdiValue)}</p>
              <p className="truncate text-xs text-muted-foreground">BDI ({bdiPercentage}%)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="rounded-lg bg-success/20 p-1.5 sm:p-2">
              <DollarSign className="h-4 w-4 text-success sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-success sm:text-lg">{formatCurrency(summary.grandTotal)}</p>
              <p className="truncate text-xs text-muted-foreground">Valor Final</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 sm:p-6">
          <CardTitle className="text-base">Itens do Orçamento</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateBudget}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button size="sm">
              <FileDown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Material</th>
                  <th className="w-[100px] px-3 py-2 text-right font-medium">Qtd</th>
                  <th className="w-[120px] px-3 py-2 text-right font-medium">Custo Un.</th>
                  <th className="w-[120px] px-3 py-2 text-right font-medium">Custo Total</th>
                  <th className="w-[80px] px-3 py-2 text-right font-medium">Margem</th>
                  <th className="w-[120px] px-3 py-2 text-right font-medium">Preço Final</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-medium">{item.materials?.description || 'Material'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.requirements?.generic_item}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.quantity} {item.materials?.unit}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {formatCurrency(item.total_cost)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted-foreground">
                      {item.margin_applied}%
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-success">
                      {formatCurrency(item.final_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td colSpan={3} className="px-3 py-3 text-right font-medium">
                    Subtotal
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs">
                    {formatCurrency(summary.totalCost)}
                  </td>
                  <td></td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatCurrency(summary.totalFinalPrice)}
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">
                    BDI ({bdiPercentage}%)
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {formatCurrency(summary.bdiValue)}
                  </td>
                </tr>
                <tr className="bg-success/10">
                  <td colSpan={3} className="px-3 py-3 text-right text-lg font-bold">
                    Total Geral
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-3 text-right text-lg font-bold text-success">
                    {formatCurrency(summary.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {budgetItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <p className="truncate font-medium text-sm">{item.materials?.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.requirements?.generic_item}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="ml-1">{item.quantity} {item.materials?.unit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margem:</span>
                    <span className="ml-1">{item.margin_applied}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="ml-1">{formatCurrency(item.total_cost)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="ml-1 font-medium text-success">{formatCurrency(item.final_price)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile Summary */}
            <div className="rounded-lg border-2 border-success/50 bg-success/5 p-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(summary.totalFinalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BDI ({bdiPercentage}%):</span>
                  <span>{formatCurrency(summary.bdiValue)}</span>
                </div>
                <div className="flex justify-between border-t border-success/30 pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-success">{formatCurrency(summary.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
