import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['draft', 'sent', 'collecting', 'closed']
    if (!status || !validStatuses.includes(status)) {
      return Response.json(
        { error: `Status inválido. Valores permitidos: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rfqs')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return Response.json({ success: true, rfq: data })
  } catch (error) {
    console.error('Error updating RFQ status:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar status' },
      { status: 500 }
    )
  }
}
