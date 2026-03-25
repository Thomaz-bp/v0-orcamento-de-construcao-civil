import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { StatusBadge, getProjectStatusVariant, getProjectStatusLabel } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FolderKanban,
  Package,
  Truck,
  Send,
  ArrowRight,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/types'

async function getDashboardData() {
  const supabase = await createClient()

  const [projectsRes, materialsRes, suppliersRes, rfqsRes, recentProjectsRes] = await Promise.all([
    supabase.from('projects').select('id, status', { count: 'exact' }),
    supabase.from('materials').select('id', { count: 'exact' }).eq('active', true),
    supabase.from('suppliers').select('id', { count: 'exact' }).eq('active', true),
    supabase.from('rfqs').select('id, status', { count: 'exact' }),
    supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const activeProjects = projectsRes.data?.filter(p => 
    ['in_progress', 'quoting', 'budgeting'].includes(p.status)
  ).length || 0

  const openRfqs = rfqsRes.data?.filter(r => 
    ['draft', 'sent', 'collecting'].includes(r.status)
  ).length || 0

  return {
    totalProjects: projectsRes.count || 0,
    activeProjects,
    totalMaterials: materialsRes.count || 0,
    totalSuppliers: suppliersRes.count || 0,
    totalRfqs: rfqsRes.count || 0,
    openRfqs,
    recentProjects: (recentProjectsRes.data || []) as Project[],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <AppShell>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do sistema"
      >
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/projetos/novo">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Projeto</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Projetos Ativos"
            value={data.activeProjects}
            subtitle={`${data.totalProjects} total`}
            icon={FolderKanban}
          />
          <StatCard
            title="Materiais"
            value={data.totalMaterials}
            subtitle="cadastrados"
            icon={Package}
          />
          <StatCard
            title="Fornecedores"
            value={data.totalSuppliers}
            subtitle="cadastrados"
            icon={Truck}
          />
          <StatCard
            title="Cotações"
            value={data.openRfqs}
            subtitle={`${data.totalRfqs} total`}
            icon={Send}
          />
        </div>

        {/* Recent Projects & Quick Actions */}
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-medium sm:text-base">
                Projetos Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
                <Link href="/projetos">
                  Ver todos
                  <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
              {data.recentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center sm:py-8">
                  <FolderKanban className="mb-3 h-8 w-8 text-muted-foreground/50 sm:h-10 sm:w-10" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum projeto cadastrado
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 sm:mt-4" asChild>
                    <Link href="/projetos/novo">Criar primeiro projeto</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentProjects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projetos/${project.id}`}
                        className="flex items-center justify-between gap-2 py-2.5 transition-colors hover:bg-muted/50 sm:py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {project.client_name || 'Sem cliente'}
                            {project.location_city && ` - ${project.location_city}/${project.location_uf}`}
                          </p>
                        </div>
                        <StatusBadge variant={getProjectStatusVariant(project.status)} className="shrink-0 text-xs">
                          {getProjectStatusLabel(project.status)}
                        </StatusBadge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-medium sm:text-base">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
              <div className="grid gap-2 sm:gap-3">
                <Button variant="outline" className="h-auto justify-start py-2.5 text-sm sm:py-3" asChild>
                  <Link href="/projetos/novo">
                    <FolderKanban className="mr-3 h-4 w-4 text-muted-foreground" />
                    Criar novo projeto
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto justify-start py-2.5 text-sm sm:py-3" asChild>
                  <Link href="/materiais/novo">
                    <Package className="mr-3 h-4 w-4 text-muted-foreground" />
                    Cadastrar material
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto justify-start py-2.5 text-sm sm:py-3" asChild>
                  <Link href="/fornecedores/novo">
                    <Truck className="mr-3 h-4 w-4 text-muted-foreground" />
                    Cadastrar fornecedor
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto justify-start py-2.5 text-sm sm:py-3" asChild>
                  <Link href="/cotacoes">
                    <Send className="mr-3 h-4 w-4 text-muted-foreground" />
                    Gerenciar cotações
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Overview */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-sm font-medium sm:text-base">
              Fluxo de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:pb-0">
              {[
                { step: 1, title: 'Memorial', desc: 'Upload e extração', icon: '📄', href: '/memoriais' },
                { step: 2, title: 'Conferência', desc: 'Match de requisitos', icon: '🔍', href: '/conferencia' },
                { step: 3, title: 'Cotação', desc: 'Envio de RFQs', icon: '📨', href: '/cotacoes' },
                { step: 4, title: 'Análise', desc: 'Comparativo técnico', icon: '📊', href: '/analise' },
                { step: 5, title: 'Proposta', desc: 'Orçamento final', icon: '💰', href: '/orcamentos' },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="group flex min-w-[120px] shrink-0 flex-col items-center rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary/50 hover:bg-accent sm:min-w-0 sm:p-4"
                >
                  <span className="text-xl sm:text-2xl">{item.icon}</span>
                  <span className="mt-1.5 text-xs font-medium text-muted-foreground sm:mt-2">
                    Etapa {item.step}
                  </span>
                  <span className="mt-0.5 text-xs font-medium text-foreground sm:mt-1 sm:text-sm">
                    {item.title}
                  </span>
                  <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                    {item.desc}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
