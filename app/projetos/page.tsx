import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, FolderKanban, MapPin, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/types'
import { StatusBadge, getProjectStatusVariant, getProjectStatusLabel } from '@/components/status-badge'

async function getProjects(search?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,client_name.ilike.%${search}%,location_city.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data as Project[]
}

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const projects = await getProjects(search)

  return (
    <AppShell>
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos"
      >
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/projetos/novo">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Projeto</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <form className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Buscar projetos..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
            <FolderKanban className="mb-4 h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
            <h3 className="mb-1 text-base font-medium text-foreground sm:text-lg">
              Nenhum projeto cadastrado
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Comece criando seu primeiro projeto de orçamento.
            </p>
            <Button asChild>
              <Link href="/projetos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Criar Projeto
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group transition-colors hover:border-primary/50">
                <CardHeader className="p-4 pb-2 sm:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                      <Link href={`/projetos/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <StatusBadge variant={getProjectStatusVariant(project.status)} className="shrink-0 text-xs">
                      {getProjectStatusLabel(project.status)}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    {project.client_name && (
                      <p className="truncate">{project.client_name}</p>
                    )}
                    {(project.location_city || project.location_uf) && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {project.location_city}{project.location_city && project.location_uf && '/'}{project.location_uf}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 sm:mt-4 sm:pt-4">
                    <div className="text-xs text-muted-foreground">
                      BDI: {project.bdi_percentage}% | Margem: {project.margin_percentage}%
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                      <Link href={`/projetos/${project.id}`}>
                        Abrir
                        <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
