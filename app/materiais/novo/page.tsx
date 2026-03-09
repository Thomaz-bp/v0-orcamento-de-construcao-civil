import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { MaterialForm } from '@/components/material-form'

async function getFamilies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('material_families')
    .select('name')
    .order('name')
  return data?.map(f => f.name) || []
}

async function createMaterial(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const material = {
    internal_code: formData.get('internal_code') as string || null,
    description: formData.get('description') as string,
    unit: formData.get('unit') as string,
    family: formData.get('family') as string,
    subfamily: formData.get('subfamily') as string || null,
    technical_attributes_json: JSON.parse(formData.get('technical_attributes') as string || '{}'),
    approved_brands_json: (formData.get('approved_brands') as string)?.split(',').map(b => b.trim()).filter(Boolean) || [],
    active: formData.get('active') === 'true',
  }

  const { error } = await supabase.from('materials').insert(material)

  if (error) {
    console.error('Error creating material:', error)
    return { error: error.message }
  }

  redirect('/materiais')
}

export default async function NovoMaterialPage() {
  const families = await getFamilies()

  return (
    <AppShell>
      <PageHeader
        title="Novo Material"
        description="Cadastrar um novo material no catálogo"
      />
      <div className="p-6">
        <MaterialForm families={families} action={createMaterial} />
      </div>
    </AppShell>
  )
}
