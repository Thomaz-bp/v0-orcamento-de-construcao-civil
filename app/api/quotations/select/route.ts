import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { quotationId, rfqItemId } = await request.json()

    if (!quotationId || !rfqItemId) {
      return Response.json(
        { error: 'quotationId e rfqItemId são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Unselect all quotations for this item
    await supabase
      .from('quotations')
      .update({ selected: false })
      .eq('rfq_item_id', rfqItemId)

    // Select the chosen quotation
    const { error } = await supabase
      .from('quotations')
      .update({ selected: true })
      .eq('id', quotationId)

    if (error) {
      throw new Error(error.message)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error selecting quotation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao selecionar cotação' },
      { status: 500 }
    )
  }
}
