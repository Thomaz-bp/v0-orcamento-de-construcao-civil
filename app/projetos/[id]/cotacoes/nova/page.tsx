import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Package } from 'lucide-react'
import Link from 'next/link'

async function getProjectWithApprovedItems(projectId: string) {
  const supabase = await createClient()

  const [projectRes, itemsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_name')
      .eq('id', projectId)
      .single(),
    supabase
      .from('requirement_matches')
      .select(`
        id,
        material_id,
        requirements!inner(
          id,
          generic_item,
          memorial_id,
          memorials!inner(project_id)
        ),
        materials!inner(
          id,
          description,
          internal_code,
          unit,
          family
        )
      `)
      .eq('requirements.memorials.project_id', projectId)
      .in('status', ['approved', 'manual'])
  ])

  if (projectRes.error || !projectRes.data) {
    return null
  }

  return {
    project: projectRes.data,
    approvedItems: itemsRes.data || []
  }
}

async function createRfqFromProject(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const projectId = formData.get('project_id') as string
  const title = formData.get('title') as string
  const deadline = formData.get('deadline') as string
  const notes = formData.get('notes') as string
  const selectedItemIds = formData.getAll('selected_items') as string[]
  
  // Get quantities for each item
  const quantities: Record<string, number> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('quantity_')) {
      const itemId = key.replace('quantity_', '')
      quantities[itemId] = parseFloat(value as string) || 1
    }
  }

  // Create RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert({
      project_id: projectId,
      title,
      deadline: deadline || null,
      notes: notes || null,
      status: 'draft',
    })
    .select()
    .single()

  if (rfqError) {
    console.error('Error creating RFQ:', rfqError)
    return { error: rfqError.message }
  }

  // Get approved items details
  if (selectedItemIds.length > 0) {
    const { data: matches } = await supabase
      .from('requirement_matches')
      .select(`
        id,
        material_id,
        requirements(id),
        materials(unit)
      `)
      .in('id', selectedItemIds)

    if (matches && matches.length > 0) {
      const rfqItems = matches.map((match) => ({
        rfq_id: rfq.id,
        material_id: match.material_id,
        requirement_id: match.requirements?.id,
        quantity: quantities[match.id] || 1,
        unit: match.materials?.unit || 'un',
      }))

      const { error: itemsError } = await supabase
        .from('rfq_items')
        .insert(rfqItems)

      if (itemsError) {
        console.error('Error creating RFQ items:', itemsError)
      }
    }
  }

  // Update project status to quoting
  await supabase
    .from('projects')
    .update({ status: 'quoting' })
    .eq('id', projectId)

  redirect(`/cotacoes/${rfq.id}`)
}

export default async function NovaRfqProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProjectWithApprovedItems(id)

  if (!data) {
    notFound()
  }

  const { project, approvedItems } = data

  return (
    <AppShell>
      <PageHeader
        title="Nova Solicitação de Cotação"
        description={`Projeto: ${project.name}`}
      />

      <div className="p-4 sm:p-6">
        <form action={createRfqFromProject} className="mx-auto max-w-4xl">
          <input type="hidden" name="project_id" value={project.id} />

          <div className="mb-4 flex items-center gap-4 sm:mb-6">
            <Button variant="ghost" size="icon" type="button" asChild>
              <Link href={`/projetos/${project.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1" />
            <Button type="submit" disabled={approvedItems.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Criar RFQ</span>
              <span className="sm:hidden">Criar</span>
            </Button>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base">Informações da RFQ</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título da RFQ *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Cotação Materiais Elétricos - Fase 1"
                    defaultValue={`Cotação - ${project.name}`}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Prazo para Respostas</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="datetime-local"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Condições especiais, requisitos de entrega, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Itens para Cotação */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Itens Aprovados para Cotação
                  <span className="text-sm font-normal text-muted-foreground">
                    ({approvedItems.length} itens)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {approvedItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum item aprovado neste projeto.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete a conferência comparativa primeiro.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link href={`/projetos/${project.id}/conferencia`}>
                        Ir para Conferência
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="w-10 px-3 py-2"></th>
                            <th className="px-3 py-2 text-left font-medium">Material</th>
                            <th className="w-[100px] px-3 py-2 text-left font-medium">Código</th>
                            <th className="w-[120px] px-3 py-2 text-left font-medium">Quantidade</th>
                            <th className="w-[80px] px-3 py-2 text-left font-medium">Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedItems.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2">
                                <Checkbox
                                  name="selected_items"
                                  value={item.id}
                                  defaultChecked
                                />
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-medium">{item.materials.description}</p>
                                <p className="text-xs text-muted-foreground">{item.requirements.generic_item}</p>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {item.materials.internal_code || '-'}
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  name={`quantity_${item.id}`}
                                  min="0.01"
                                  step="0.01"
                                  defaultValue="1"
                                  className="h-8 w-24"
                                />
                              </td>
                              <td className="px-3 py-2">{item.materials.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="space-y-3 md:hidden">
                      {approvedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 rounded-lg border border-border p-3"
                        >
                          <Checkbox
                            name="selected_items"
                            value={item.id}
                            defaultChecked
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">{item.materials.description}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.requirements.generic_item}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Input
                                type="number"
                                name={`quantity_${item.id}`}
                                min="0.01"
                                step="0.01"
                                defaultValue="1"
                                className="h-8 w-20"
                              />
                              <span className="text-xs text-muted-foreground">{item.materials.unit}</span>
                              {item.materials.internal_code && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {item.materials.internal_code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
