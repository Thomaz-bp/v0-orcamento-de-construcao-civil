import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { matchId, status } = await request.json()

    if (!matchId || !status) {
      return Response.json(
        { error: 'matchId e status são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return Response.json(
        { error: 'status deve ser "approved" ou "rejected"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update match status
    const { data: match, error } = await supabase
      .from('requirement_matches')
      .update({
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', matchId)
      .select('requirement_id')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update requirement status
    const newRequirementStatus = status === 'approved' ? 'approved' : 'pending'
    await supabase
      .from('requirements')
      .update({ status: newRequirementStatus })
      .eq('id', match.requirement_id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Approve match error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao aprovar/rejeitar' },
      { status: 500 }
    )
  }
}
