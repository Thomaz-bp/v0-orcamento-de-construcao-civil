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
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, Rfq } from '@/lib/types'

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
        description="Visão geral do sistema de orçamentos"
      >
        <Button asChild>
          <Link href="/projetos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Projetos Ativos"
            value={data.activeProjects}
            subtitle={`${data.totalProjects} total`}
            icon={FolderKanban}
          />
          <StatCard
            title="Materiais Cadastrados"
            value={data.totalMaterials}
            subtitle="itens ativos"
            icon={Package}
          />
          <StatCard
            title="Fornecedores"
            value={data.totalSuppliers}
            subtitle="cadastrados"
            icon={Truck}
          />
          <StatCard
            title="Cotações Abertas"
            value={data.openRfqs}
            subtitle={`${data.totalRfqs} total`}
            icon={Send}
          />
        </div>

        {/* Recent Projects */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">
                Projetos Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projetos">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum projeto cadastrado
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/projetos/novo">Criar primeiro projeto</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentProjects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projetos/${project.id}`}
                        className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.client_name || 'Sem cliente'}
                            {project.location_city && ` - ${project.location_city}/${project.location_uf}`}
                          </p>
                        </div>
                        <StatusBadge variant={getProjectStatusVariant(project.status)}>
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
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/projetos/novo">
                    <FolderKanban className="mr-3 h-4 w-4 text-muted-foreground" />
                    Criar novo projeto
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/materiais/novo">
                    <Package className="mr-3 h-4 w-4 text-muted-foreground" />
                    Cadastrar material
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/fornecedores/novo">
                    <Truck className="mr-3 h-4 w-4 text-muted-foreground" />
                    Cadastrar fornecedor
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Fluxo de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
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
                  className="group flex flex-col items-center rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="mt-2 text-xs font-medium text-muted-foreground">
                    Etapa {item.step}
                  </span>
                  <span className="mt-1 text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
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
