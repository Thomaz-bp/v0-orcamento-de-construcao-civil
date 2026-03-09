"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calculator, ExternalLink, FileText, TrendingUp } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import type { Project } from "@/lib/types"

interface ProjectWithBudget extends Project {
  budget_items: { count: number }[]
  _sum?: { final_price: number }
}

export default function OrcamentosPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<ProjectWithBudget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    // Get projects with budget status
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        budget_items(count)
      `)
      .in("status", ["budgeting", "completed"])
      .order("updated_at", { ascending: false })

    if (data) {
      // Get budget totals for each project
      const projectsWithTotals = await Promise.all(
        data.map(async (project) => {
          const { data: budgetSum } = await supabase
            .from("budget_items")
            .select("final_price")
            .eq("project_id", project.id)
          
          const total = budgetSum?.reduce((acc, item) => acc + (item.final_price || 0), 0) || 0
          
          return {
            ...project,
            _sum: { final_price: total }
          }
        })
      )
      
      setProjects(projectsWithTotals)
    }
    setLoading(false)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  return (
    <AppShell>
      <PageHeader
        title="Orçamentos"
        description="Orçamentos finalizados e em elaboração"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orçamentos Finalizados</CardDescription>
            <CardTitle className="text-2xl">
              {projects.filter(p => p.status === "completed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em Elaboração</CardDescription>
            <CardTitle className="text-2xl">
              {projects.filter(p => p.status === "budgeting").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(
                projects.reduce((acc, p) => acc + (p._sum?.final_price || 0), 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Lista de Orçamentos
          </CardTitle>
          <CardDescription>
            Projetos com orçamento gerado ou em fase de orçamentação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
              <p className="text-sm mt-1">
                Finalize a conferência e cotações de um projeto para gerar o orçamento
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/projetos">Ver Projetos</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.client_name || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status as string} type="project" />
                    </TableCell>
                    <TableCell className="font-mono">
                      {project.budget_items?.[0]?.count || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(project._sum?.final_price || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/projetos/${project.id}/proposta`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/projetos/${project.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
