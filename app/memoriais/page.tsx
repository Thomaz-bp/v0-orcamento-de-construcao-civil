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
import { FileText, ExternalLink } from "lucide-react"
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
        description="Todos os memoriais descritivos carregados no sistema"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Memoriais
          </CardTitle>
          <CardDescription>
            Memoriais são extraídos automaticamente via IA ao serem enviados em projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
            </div>
          ) : memorials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum memorial encontrado</p>
              <p className="text-sm mt-1">
                Memoriais são adicionados através da página de projetos
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
