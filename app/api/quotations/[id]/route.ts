import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao excluir cotação' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quotations')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return Response.json({ success: true, quotation: data })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar cotação' },
      { status: 500 }
    )
  }
}
