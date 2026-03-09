import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')

  if (!projectId) {
    return Response.json({ error: 'projectId é obrigatório' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get approved matches with materials for this project
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching approved items:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const items = data.map((match) => ({
    requirementId: match.requirements.id,
    materialId: match.materials.id,
    materialDescription: match.materials.description,
    materialCode: match.materials.internal_code,
    unit: match.materials.unit,
    family: match.materials.family,
    genericItem: match.requirements.generic_item,
  }))

  return Response.json({ items })
}
