"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Calendar } from "lucide-react"
import type { Memorial } from "@/lib/types"

interface MemorialWithProject extends Memorial {
  project: { id: string; name: string } | null
}

export default function MemoriaisPage() {
  const supabase = createClient()
  const [memorials, setMemorials] = useState<MemorialWithProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMemorials()
  }, [])

  async function loadMemorials() {
    const { data } = await supabase
      .from("memorials")
      .select(`
        *,
        project:projects(id, name)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setMemorials(data as MemorialWithProject[])
    }
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "outline",
      completed: "default",
      error: "destructive"
    }
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      completed: "Extraído",
      error: "Erro"
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <AppShell>
      <PageHeader
        title="Memoriais"
        description="Memoriais descritivos"
      />

      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Lista de Memoriais
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Extraídos automaticamente via IA ao serem enviados
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-foreground" />
              </div>
            ) : memorials.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground sm:py-12">
                <FileText className="mx-auto mb-4 h-10 w-10 opacity-50 sm:h-12 sm:w-12" />
                <p className="text-sm sm:text-base">Nenhum memorial encontrado</p>
                <p className="mt-1 text-xs sm:text-sm">
                  Memoriais são adicionados através da página de projetos
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="grid gap-3 sm:hidden">
                  {memorials.map((memorial) => (
                    <div
                      key={memorial.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {memorial.original_filename || "Sem nome"}
                          </p>
                          {memorial.project && (
                            <Link
                              href={`/projetos/${memorial.project.id}`}
                              className="mt-0.5 block truncate text-xs text-primary hover:underline"
                            >
                              {memorial.project.name}
                            </Link>
                          )}
                        </div>
                        {memorial.project && (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                            <Link href={`/projetos/${memorial.project.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {getStatusBadge(memorial.extraction_status || "pending")}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(memorial.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memorials.map((memorial) => (
                        <TableRow key={memorial.id}>
                          <TableCell className="font-medium">
                            {memorial.original_filename || "Sem nome"}
                          </TableCell>
                          <TableCell>
                            {memorial.project ? (
                              <Link 
                                href={`/projetos/${memorial.project.id}`}
                                className="text-primary hover:underline"
                              >
                                {memorial.project.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(memorial.extraction_status || "pending")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(memorial.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {memorial.project && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/projetos/${memorial.project.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
