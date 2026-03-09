import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, getProjectStatusVariant, getProjectStatusLabel, getRequirementStatusVariant, getRequirementStatusLabel } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'
import { 
  ArrowLeft, 
  Pencil, 
  FileText, 
  CheckSquare, 
  Send, 
  Calculator,
  Upload,
  Sparkles,
  MapPin,
  Building2,
  Percent,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, Memorial, Requirement } from '@/lib/types'
import { MemorialUpload } from '@/components/memorial-upload'

async function getProjectData(id: string) {
  const supabase = await createClient()

  const [projectRes, memorialsRes, requirementsRes, rfqsRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('memorials').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('requirements')
      .select('*, memorials!inner(project_id)')
      .eq('memorials.project_id', id),
    supabase.from('rfqs').select('id, status').eq('project_id', id),
  ])

  if (projectRes.error || !projectRes.data) {
    return null
  }

  return {
    project: projectRes.data as Project,
    memorials: (memorialsRes.data || []) as Memorial[],
    requirements: (requirementsRes.data || []) as Requirement[],
    rfqCount: rfqsRes.data?.length || 0,
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProjectData(id)

  if (!data) {
    notFound()
  }

  const { project, memorials, requirements, rfqCount } = data

  const pendingRequirements = requirements.filter(r => r.status === 'pending').length
  const approvedRequirements = requirements.filter(r => r.status === 'approved').length

  return (
    <AppShell>
      <PageHeader
        title={project.name}
        description={project.client_name || 'Sem cliente definido'}
      >
        <StatusBadge variant={getProjectStatusVariant(project.status)} className="mr-2">
          {getProjectStatusLabel(project.status)}
        </StatusBadge>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projetos/${project.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {/* Project Info */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Requisitos Extraídos"
            value={requirements.length}
            subtitle={`${pendingRequirements} pendentes`}
            icon={FileText}
          />
          <StatCard
            title="Aprovados"
            value={approvedRequirements}
            subtitle="requisitos aprovados"
            icon={CheckSquare}
          />
          <StatCard
            title="Cotações"
            value={rfqCount}
            subtitle="RFQs criadas"
            icon={Send}
          />
          <StatCard
            title="BDI / Margem"
            value={`${project.bdi_percentage}% / ${project.margin_percentage}%`}
            subtitle="parâmetros financeiros"
            icon={Percent}
          />
        </div>

        {/* Project Details Card */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap gap-6 pt-6">
            {project.location_city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {project.location_city}/{project.location_uf}
              </div>
            )}
            {project.description && (
              <p className="w-full text-sm text-muted-foreground">{project.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="memorial" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="memorial" className="gap-2">
              <FileText className="h-4 w-4" />
              Memorial
            </TabsTrigger>
            <TabsTrigger value="requisitos" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Requisitos ({requirements.length})
            </TabsTrigger>
            <TabsTrigger value="cotacoes" className="gap-2">
              <Send className="h-4 w-4" />
              Cotações
            </TabsTrigger>
            <TabsTrigger value="orcamento" className="gap-2">
              <Calculator className="h-4 w-4" />
              Orçamento
            </TabsTrigger>
          </TabsList>

          {/* Memorial Tab */}
          <TabsContent value="memorial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Extração de Memorial com IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MemorialUpload projectId={project.id} memorials={memorials} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requisitos Tab */}
          <TabsContent value="requisitos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Requisitos Extraídos</CardTitle>
                {requirements.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projetos/${project.id}/conferencia`}>
                      Conferência Comparativa
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {requirements.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p>Nenhum requisito extraído ainda.</p>
                    <p className="text-sm">Faça upload de um memorial descritivo na aba Memorial.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {requirements.slice(0, 10).map((req) => (
                      <div key={req.id} className="py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{req.generic_item}</p>
                            {req.section && (
                              <p className="text-xs text-muted-foreground">
                                Seção: {req.section}
                              </p>
                            )}
                            {req.application_location && (
                              <p className="text-xs text-muted-foreground">
                                Local: {req.application_location}
                              </p>
                            )}
                            {req.source_excerpt && (
                              <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
                                &quot;{req.source_excerpt}&quot;
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {Math.round(req.confidence_score * 100)}%
                            </span>
                            <StatusBadge variant={getRequirementStatusVariant(req.status)}>
                              {getRequirementStatusLabel(req.status)}
                            </StatusBadge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {requirements.length > 10 && (
                      <div className="py-3 text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projetos/${project.id}/requisitos`}>
                            Ver todos ({requirements.length})
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cotações Tab */}
          <TabsContent value="cotacoes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Solicitações de Cotação (RFQ)</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/projetos/${project.id}/cotacoes/nova`}>
                    Nova RFQ
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <Send className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>Nenhuma cotação criada ainda.</p>
                  <p className="text-sm">Crie uma RFQ após aprovar os requisitos.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orçamento Tab */}
          <TabsContent value="orcamento">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Orçamento Consolidado</CardTitle>
                <Button size="sm" disabled>
                  Gerar Proposta
                </Button>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <Calculator className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>Orçamento ainda não consolidado.</p>
                  <p className="text-sm">Complete as cotações para gerar o orçamento.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
