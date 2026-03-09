import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, Requirement, Material, RequirementMatch } from '@/lib/types'
import { ConferenceView } from '@/components/conference-view'

async function getConferenceData(projectId: string) {
  const supabase = await createClient()

  const [projectRes, requirementsRes, materialsRes, matchesRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase
      .from('requirements')
      .select('*, memorials!inner(project_id)')
      .eq('memorials.project_id', projectId)
      .order('section'),
    supabase.from('materials').select('*').eq('active', true).order('description'),
    supabase
      .from('requirement_matches')
      .select('*, requirements!inner(memorial_id, memorials!inner(project_id))')
      .eq('requirements.memorials.project_id', projectId),
  ])

  if (projectRes.error || !projectRes.data) {
    return null
  }

  return {
    project: projectRes.data as Project,
    requirements: (requirementsRes.data || []) as Requirement[],
    materials: (materialsRes.data || []) as Material[],
    matches: (matchesRes.data || []) as RequirementMatch[],
  }
}

export default async function ConferenciaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getConferenceData(id)

  if (!data) {
    notFound()
  }

  const { project, requirements, materials, matches } = data

  // Group matches by requirement
  const matchesByRequirement = matches.reduce((acc, match) => {
    if (!acc[match.requirement_id]) {
      acc[match.requirement_id] = []
    }
    acc[match.requirement_id].push(match)
    return acc
  }, {} as Record<string, RequirementMatch[]>)

  const matchedCount = requirements.filter(r => matchesByRequirement[r.id]?.length > 0).length
  const unmatchedCount = requirements.length - matchedCount
  const approvedCount = matches.filter(m => m.status === 'approved').length

  return (
    <AppShell>
      <PageHeader
        title="Conferência Comparativa"
        description={project.name}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projetos/${project.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Projeto
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{requirements.length}</p>
                <p className="text-xs text-muted-foreground">Requisitos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-success/20 p-2">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{matchedCount}</p>
                <p className="text-xs text-muted-foreground">Associados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-warning/20 p-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{unmatchedCount}</p>
                <p className="text-xs text-muted-foreground">Gaps (sem match)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/20 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conference View */}
        <ConferenceView
          projectId={project.id}
          requirements={requirements}
          materials={materials}
          matchesByRequirement={matchesByRequirement}
        />
      </div>
    </AppShell>
  )
}
