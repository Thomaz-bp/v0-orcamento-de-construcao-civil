import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { supplierIds } = body

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return Response.json(
        { error: 'supplierIds é obrigatório e deve ser um array' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        id,
        title,
        deadline,
        notes,
        projects(name, client_name),
        rfq_items(
          id,
          quantity,
          unit,
          materials(description, internal_code)
        )
      `)
      .eq('id', id)
      .single()

    if (rfqError || !rfq) {
      return Response.json({ error: 'RFQ não encontrada' }, { status: 404 })
    }

    // Get supplier details
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, company_name, email, contact_name')
      .in('id', supplierIds)

    if (!suppliers || suppliers.length === 0) {
      return Response.json({ error: 'Fornecedores não encontrados' }, { status: 404 })
    }

    // Update RFQ status to sent
    const { error: updateError } = await supabase
      .from('rfqs')
      .update({ status: 'sent' })
      .eq('id', id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // In a real implementation, here we would:
    // 1. Send emails to suppliers using a service like Resend, SendGrid, etc.
    // 2. Create a record of which suppliers were contacted
    // 3. Generate unique response links for each supplier

    // For now, we just return success with the list of contacted suppliers
    return Response.json({
      success: true,
      message: `RFQ enviada para ${suppliers.length} fornecedor(es)`,
      suppliers: suppliers.map(s => ({
        id: s.id,
        name: s.company_name,
        email: s.email,
      })),
    })
  } catch (error) {
    console.error('Error sending RFQ:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar RFQ' },
      { status: 500 }
    )
  }
}
