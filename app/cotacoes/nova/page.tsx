import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { RfqForm } from '@/components/rfq-form'

async function getProjectsWithApprovedRequirements() {
  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client_name')
    .in('status', ['in_progress', 'quoting'])
    .order('name')

  return projects || []
}

async function createRfq(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const projectId = formData.get('project_id') as string
  const title = formData.get('title') as string
  const deadline = formData.get('deadline') as string
  const notes = formData.get('notes') as string
  const selectedItems = JSON.parse(formData.get('selected_items') as string || '[]')

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

  // Create RFQ items
  if (selectedItems.length > 0) {
    const rfqItems = selectedItems.map((item: { materialId: string; requirementId: string; quantity: number; unit: string }) => ({
      rfq_id: rfq.id,
      material_id: item.materialId,
      requirement_id: item.requirementId,
      quantity: item.quantity,
      unit: item.unit,
    }))

    const { error: itemsError } = await supabase
      .from('rfq_items')
      .insert(rfqItems)

    if (itemsError) {
      console.error('Error creating RFQ items:', itemsError)
    }
  }

  // Update project status
  await supabase
    .from('projects')
    .update({ status: 'quoting' })
    .eq('id', projectId)

  redirect(`/cotacoes/${rfq.id}`)
}

export default async function NovaRfqPage() {
  const projects = await getProjectsWithApprovedRequirements()

  return (
    <AppShell>
      <PageHeader
        title="Nova Solicitação de Cotação"
        description="Criar uma nova RFQ para fornecedores"
      />
      <div className="p-6">
        <RfqForm projects={projects} action={createRfq} />
      </div>
    </AppShell>
  )
}
