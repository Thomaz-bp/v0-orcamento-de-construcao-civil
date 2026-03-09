import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { SupplierForm } from '@/components/supplier-form'

async function createSupplier(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const supplier = {
    company_name: formData.get('company_name') as string,
    cnpj: formData.get('cnpj') as string || null,
    contact_name: formData.get('contact_name') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    location_uf: formData.get('location_uf') as string || null,
    location_city: formData.get('location_city') as string || null,
    lead_time_days: parseInt(formData.get('lead_time_days') as string) || 7,
    payment_terms: formData.get('payment_terms') as string || null,
    rating: parseFloat(formData.get('rating') as string) || 0,
    active: formData.get('active') === 'true',
  }

  const { error } = await supabase.from('suppliers').insert(supplier)

  if (error) {
    console.error('Error creating supplier:', error)
    return { error: error.message }
  }

  redirect('/fornecedores')
}

export default function NovoFornecedorPage() {
  return (
    <AppShell>
      <PageHeader
        title="Novo Fornecedor"
        description="Cadastrar um novo fornecedor"
      />
      <div className="p-6">
        <SupplierForm action={createSupplier} />
      </div>
    </AppShell>
  )
}
