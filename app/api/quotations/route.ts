import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      rfq_item_id,
      supplier_id,
      unit_price,
      quantity,
      freight_value = 0,
      lead_time_days = 7,
    } = body

    if (!rfq_item_id || !supplier_id || !unit_price || !quantity) {
      return Response.json(
        { error: 'Campos obrigatórios: rfq_item_id, supplier_id, unit_price, quantity' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calculate total landed cost
    const subtotal = unit_price * quantity
    const total_landed_cost = subtotal + freight_value

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        rfq_item_id,
        supplier_id,
        unit_price,
        quantity,
        freight_value,
        total_landed_cost,
        lead_time_days,
        selected: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return Response.json({ success: true, quotation: data })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar cotação' },
      { status: 500 }
    )
  }
}
