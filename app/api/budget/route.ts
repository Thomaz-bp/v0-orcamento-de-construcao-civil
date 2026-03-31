import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')

  if (!projectId) {
    return Response.json({ error: 'projectId é obrigatório' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budget_items')
    .select(`
      id,
      quantity,
      unit_cost,
      total_cost,
      margin_applied,
      final_price,
      materials(description, internal_code, unit),
      requirements(generic_item)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching budget items:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ items: data || [] })
}
