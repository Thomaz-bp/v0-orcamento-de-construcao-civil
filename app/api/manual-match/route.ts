import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { requirementId, materialId } = await request.json()

    if (!requirementId || !materialId) {
      return Response.json(
        { error: 'requirementId e materialId são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Delete existing matches for this requirement
    await supabase
      .from('requirement_matches')
      .delete()
      .eq('requirement_id', requirementId)

    // Insert new manual match
    const { error } = await supabase
      .from('requirement_matches')
      .insert({
        requirement_id: requirementId,
        material_id: materialId,
        match_confidence: 1.0,
        match_reasons_json: ['Associação manual'],
        status: 'manual',
      })

    if (error) {
      throw new Error(error.message)
    }

    // Update requirement status
    await supabase
      .from('requirements')
      .update({ status: 'matched' })
      .eq('id', requirementId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Manual match error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao associar' },
      { status: 500 }
    )
  }
}
