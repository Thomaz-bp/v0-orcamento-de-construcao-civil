"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Calculator, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Project, BudgetItem, Quotation, Requirement, Material } from "@/lib/types"

interface BudgetSummary {
  totalCost: number
  totalWithBdi: number
  totalWithMargin: number
  itemCount: number
  coveredRequirements: number
  totalRequirements: number
}

interface ConsolidatedItem {
  id: string
  requirement: Requirement
  material: Material | null
  quotation: Quotation | null
  quantity: number
  unitCost: number
  totalCost: number
  finalPrice: number
}

export default function PropostaPage() {
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [consolidatedItems, setConsolidatedItems] = useState<ConsolidatedItem[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [bdiOverride, setBdiOverride] = useState<number | null>(null)
  const [marginOverride, setMarginOverride] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    setLoading(true)
    
    // Load project
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()
    
    if (projectData) {
      setProject(projectData)
      setBdiOverride(projectData.bdi_percentage)
      setMarginOverride(projectData.margin_percentage)
    }

    // Load all requirements with matches and quotations
    const { data: requirements } = await supabase
      .from("requirements")
      .select(`
        *,
        memorial:memorials!inner(project_id)
      `)
      .eq("memorial.project_id", projectId)

    // Load approved matches with selected quotations
    const { data: matches } = await supabase
      .from("requirement_matches")
      .select(`
        *,
        requirement:requirements(*),
        material:materials(*)
      `)
      .eq("status", "approved")

    // Filter matches for this project
    const projectRequirementIds = requirements?.map(r => r.id) || []
    const projectMatches = matches?.filter(m => 
      projectRequirementIds.includes(m.requirement_id)
    ) || []

    // Load selected quotations for matched materials
    const materialIds = projectMatches.map(m => m.material_id)
    const { data: quotations } = await supabase
      .from("quotations")
      .select(`
        *,
        rfq_item:rfq_items(material_id, quantity)
      `)
      .in("rfq_item.material_id", materialIds)
      .eq("selected", true)

    // Consolidate items
    const items: ConsolidatedItem[] = []
    let totalCost = 0
    let coveredCount = 0

    for (const req of requirements || []) {
      const match = projectMatches.find(m => m.requirement_id === req.id)
      const material = match?.material || null
      const quotation = quotations?.find(q => 
        q.rfq_item?.material_id === match?.material_id
      ) || null

      const quantity = quotation?.quantity || 1
      const unitCost = quotation?.total_landed_cost || quotation?.unit_price || 0
      const itemTotal = quantity * unitCost

      if (match && quotation) {
        coveredCount++
        totalCost += itemTotal
      }

      items.push({
        id: req.id,
        requirement: req,
        material,
        quotation,
        quantity,
        unitCost,
        totalCost: itemTotal,
        finalPrice: 0 // Will be calculated with BDI/margin
      })
    }

    // Calculate summary with BDI and margin
    const bdi = bdiOverride ?? projectData?.bdi_percentage ?? 25
    const margin = marginOverride ?? projectData?.margin_percentage ?? 10

    const totalWithBdi = totalCost * (1 + bdi / 100)
    const totalWithMargin = totalWithBdi * (1 + margin / 100)

    // Update final prices in items
    const itemsWithPrices = items.map(item => ({
      ...item,
      finalPrice: item.totalCost * (1 + bdi / 100) * (1 + margin / 100)
    }))

    setConsolidatedItems(itemsWithPrices)
    setSummary({
      totalCost,
      totalWithBdi,
      totalWithMargin,
      itemCount: items.length,
      coveredRequirements: coveredCount,
      totalRequirements: requirements?.length || 0
    })

    setLoading(false)
  }

  async function generateBudget() {
    setGenerating(true)
    
    // Create budget items in database
    const budgetItems = consolidatedItems
      .filter(item => item.quotation)
      .map(item => ({
        project_id: projectId,
        requirement_id: item.requirement.id,
        material_id: item.material?.id,
        quotation_id: item.quotation?.id,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.totalCost,
        margin_applied: (bdiOverride || 25) + (marginOverride || 10),
        final_price: item.finalPrice,
        justification: `Auto-gerado via cotação selecionada`
      }))

    const { error } = await supabase
      .from("budget_items")
      .upsert(budgetItems, { 
        onConflict: "project_id,requirement_id",
        ignoreDuplicates: false 
      })

    if (!error) {
      // Update project status
      await supabase
        .from("projects")
        .update({ 
          status: "completed",
          bdi_percentage: bdiOverride,
          margin_percentage: marginOverride
        })
        .eq("id", projectId)
    }

    setGenerating(false)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  function exportToCSV() {
    const headers = [
      "Item",
      "Seção",
      "Requisito",
      "Material",
      "Fornecedor",
      "Qtd",
      "Un",
      "Custo Unit.",
      "Custo Total",
      "Preço Final"
    ]

    const rows = consolidatedItems.map((item, idx) => [
      idx + 1,
      item.requirement.section || "-",
      item.requirement.generic_item,
      item.material?.description || "Não definido",
      "Fornecedor", // TODO: Add supplier name
      item.quantity,
      item.material?.unit || "un",
      item.unitCost.toFixed(2),
      item.totalCost.toFixed(2),
      item.finalPrice.toFixed(2)
    ])

    const csv = [headers, ...rows]
      .map(row => row.join(";"))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `proposta-${project?.name || "projeto"}.csv`
    link.click()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </AppShell>
    )
  }

  const coveragePercent = summary 
    ? Math.round((summary.coveredRequirements / summary.totalRequirements) * 100) 
    : 0

  return (
    <AppShell>
      <PageHeader
        title="Proposta Comercial"
        description={`Consolidação do orçamento para ${project?.name}`}
        backHref={`/projetos/${projectId}`}
      />

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="itens">Itens Detalhados</TabsTrigger>
          <TabsTrigger value="comparativo">Mapa Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Custo Direto</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(summary?.totalCost || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Soma das cotações selecionadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Com BDI ({bdiOverride || 25}%)</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(summary?.totalWithBdi || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Custos indiretos e despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Preço Final ({marginOverride || 10}% margem)</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  {formatCurrency(summary?.totalWithMargin || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Valor da proposta comercial
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cobertura</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {coveragePercent}%
                  {coveragePercent === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {summary?.coveredRequirements} de {summary?.totalRequirements} requisitos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* BDI and Margin Override */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Ajuste de Margens
              </CardTitle>
              <CardDescription>
                Configure o BDI e margem de lucro para este projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bdi">BDI (%)</Label>
                  <Input
                    id="bdi"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={bdiOverride || ""}
                    onChange={(e) => {
                      setBdiOverride(parseFloat(e.target.value) || 0)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonificação e Despesas Indiretas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margin">Margem de Lucro (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={marginOverride || ""}
                    onChange={(e) => {
                      setMarginOverride(parseFloat(e.target.value) || 0)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lucro esperado sobre o valor
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={loadData} variant="outline">
                  Recalcular
                </Button>
                <Button onClick={generateBudget} disabled={generating}>
                  {generating ? "Gerando..." : "Gerar Orçamento Final"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF (em breve)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Orçamento</CardTitle>
              <CardDescription>
                Detalhamento de todos os itens com custos e preços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Requisito</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                    <TableHead className="text-right">Preço Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedItems.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.requirement.generic_item}</div>
                        {item.requirement.section && (
                          <div className="text-xs text-muted-foreground">
                            {item.requirement.section}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.material ? (
                          <div>
                            <div className="font-medium">{item.material.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.material.internal_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-500 text-sm">
                            Sem material definido
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quantity} {item.material?.unit || "un"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quotation ? formatCurrency(item.unitCost) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quotation ? formatCurrency(item.totalCost) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {item.quotation ? formatCurrency(item.finalPrice) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals Row */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Custo Total</div>
                    <div className="text-lg font-mono">
                      {formatCurrency(summary?.totalCost || 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Preço Final</div>
                    <div className="text-xl font-mono font-bold text-primary">
                      {formatCurrency(summary?.totalWithMargin || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mapa Comparativo
              </CardTitle>
              <CardDescription>
                Comparação entre requisitos do memorial e materiais cotados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisito Memorial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Material Selecionado</TableHead>
                    <TableHead>Atributos Técnicos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedItems.map((item) => {
                    const hasMatch = !!item.material
                    const hasQuotation = !!item.quotation
                    const status = hasQuotation ? "complete" : hasMatch ? "partial" : "missing"

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.requirement.generic_item}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.requirement.source_excerpt?.slice(0, 80)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          {status === "complete" && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                              <CheckCircle2 className="h-3 w-3" />
                              Cotado
                            </span>
                          )}
                          {status === "partial" && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
                              <AlertCircle className="h-3 w-3" />
                              Sem cotação
                            </span>
                          )}
                          {status === "missing" && (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                              <AlertCircle className="h-3 w-3" />
                              Sem material
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.material ? (
                            <div>
                              <div className="font-medium">{item.material.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.material.family} | {item.material.unit}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.material?.technical_attributes_json && (
                            <div className="text-xs space-y-0.5">
                              {Object.entries(
                                item.material.technical_attributes_json as Record<string, unknown>
                              )
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-muted-foreground">{key}:</span>{" "}
                                    {String(value)}
                                  </div>
                                ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {hasQuotation ? formatCurrency(item.finalPrice) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
