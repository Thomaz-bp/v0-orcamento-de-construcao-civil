import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return Response.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get project with BDI and margin settings
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, bdi_percentage, margin_percentage')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    // Get all closed RFQs with selected quotations
    const { data: rfqItems, error: rfqError } = await supabase
      .from('rfq_items')
      .select(`
        id,
        quantity,
        unit,
        material_id,
        requirement_id,
        rfqs!inner(project_id, status),
        quotations!inner(
          id,
          unit_price,
          quantity,
          total_landed_cost,
          selected
        )
      `)
      .eq('rfqs.project_id', projectId)
      .eq('rfqs.status', 'closed')
      .eq('quotations.selected', true)

    if (rfqError) {
      throw new Error(rfqError.message)
    }

    if (!rfqItems || rfqItems.length === 0) {
      return Response.json(
        { error: 'Nenhuma cotação fechada encontrada para este projeto' },
        { status: 400 }
      )
    }

    // Delete existing budget items for this project
    await supabase
      .from('budget_items')
      .delete()
      .eq('project_id', projectId)

    // Create budget items from selected quotations
    const budgetItems = rfqItems.map((item) => {
      const quotation = item.quotations[0]
      const unitCost = quotation.total_landed_cost 
        ? quotation.total_landed_cost / quotation.quantity
        : quotation.unit_price
      const totalCost = unitCost * item.quantity
      const marginApplied = project.margin_percentage
      const finalPrice = totalCost * (1 + marginApplied / 100)

      return {
        project_id: projectId,
        requirement_id: item.requirement_id,
        material_id: item.material_id,
        quotation_id: quotation.id,
        quantity: item.quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        margin_applied: marginApplied,
        final_price: finalPrice,
      }
    })

    const { error: insertError } = await supabase
      .from('budget_items')
      .insert(budgetItems)

    if (insertError) {
      throw new Error(insertError.message)
    }

    // Update project status to budgeting
    await supabase
      .from('projects')
      .update({ status: 'budgeting' })
      .eq('id', projectId)

    // Calculate totals
    const totalCost = budgetItems.reduce((sum, item) => sum + item.total_cost, 0)
    const totalFinalPrice = budgetItems.reduce((sum, item) => sum + item.final_price, 0)
    const bdiValue = totalFinalPrice * (project.bdi_percentage / 100)
    const grandTotal = totalFinalPrice + bdiValue

    return Response.json({
      success: true,
      summary: {
        itemCount: budgetItems.length,
        totalCost,
        totalFinalPrice,
        bdiPercentage: project.bdi_percentage,
        bdiValue,
        grandTotal,
      },
    })
  } catch (error) {
    console.error('Error generating budget:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar orçamento' },
      { status: 500 }
    )
  }
}
