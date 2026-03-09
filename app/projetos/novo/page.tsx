import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { ProjectForm } from '@/components/project-form'

async function createProject(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const project = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    client_name: formData.get('client_name') as string || null,
    location_uf: formData.get('location_uf') as string || null,
    location_city: formData.get('location_city') as string || null,
    bdi_percentage: parseFloat(formData.get('bdi_percentage') as string) || 25,
    margin_percentage: parseFloat(formData.get('margin_percentage') as string) || 10,
    status: 'draft',
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return { error: error.message }
  }

  redirect(`/projetos/${data.id}`)
}

export default function NovoProjetoPage() {
  return (
    <AppShell>
      <PageHeader
        title="Novo Projeto"
        description="Criar um novo projeto de orçamento"
      />
      <div className="p-6">
        <ProjectForm action={createProject} />
      </div>
    </AppShell>
  )
}
