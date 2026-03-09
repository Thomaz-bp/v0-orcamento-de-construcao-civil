import { createClient } from '@/lib/supabase/server'
import { createGroq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const MatchResultSchema = z.object({
  matches: z.array(z.object({
    requirementId: z.string(),
    materialId: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    reasons: z.array(z.string()),
  })),
})

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return Response.json({ error: 'projectId é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get requirements for this project
    const { data: requirements } = await supabase
      .from('requirements')
      .select('*, memorials!inner(project_id)')
      .eq('memorials.project_id', projectId)
      .eq('status', 'pending')

    if (!requirements || requirements.length === 0) {
      return Response.json({ message: 'Nenhum requisito pendente' })
    }

    // Get all active materials
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .eq('active', true)

    if (!materials || materials.length === 0) {
      return Response.json({ error: 'Nenhum material cadastrado' }, { status: 400 })
    }

    // Prepare context for AI
    const materialsContext = materials.map(m => ({
      id: m.id,
      code: m.internal_code,
      description: m.description,
      family: m.family,
      subfamily: m.subfamily,
      unit: m.unit,
      attributes: m.technical_attributes_json,
      brands: m.approved_brands_json,
    }))

    const requirementsContext = requirements.map(r => ({
      id: r.id,
      item: r.generic_item,
      section: r.section,
      location: r.application_location,
      attributes: r.attributes_json,
      restrictions: r.restrictions_json,
    }))

    // Use AI to match requirements to materials
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: MatchResultSchema,
      prompt: `Você é um especialista em orçamentos de construção civil.
Analise os requisitos extraídos de um memorial descritivo e associe cada um ao material mais adequado do catálogo.

Considere:
- Família do material (elétrica, hidráulica, estrutural, etc.)
- Atributos técnicos (dimensões, especificações)
- Restrições (marcas aprovadas, certificações)
- Descrição do item

REQUISITOS:
${JSON.stringify(requirementsContext, null, 2)}

CATÁLOGO DE MATERIAIS:
${JSON.stringify(materialsContext, null, 2)}

Para cada requisito, retorne:
- requirementId: ID do requisito
- materialId: ID do material mais adequado (ou null se não houver match)
- confidence: nível de confiança (0-1)
- reasons: lista de razões para o match`,
    })

    // Insert matches
    const matchesToInsert = object.matches
      .filter(m => m.materialId)
      .map(match => ({
        requirement_id: match.requirementId,
        material_id: match.materialId,
        match_confidence: match.confidence,
        match_reasons_json: match.reasons,
        status: 'suggested',
      }))

    if (matchesToInsert.length > 0) {
      // Delete existing suggested matches for these requirements
      const requirementIds = matchesToInsert.map(m => m.requirement_id)
      await supabase
        .from('requirement_matches')
        .delete()
        .in('requirement_id', requirementIds)
        .eq('status', 'suggested')

      // Insert new matches
      const { error: matchError } = await supabase
        .from('requirement_matches')
        .insert(matchesToInsert)

      if (matchError) {
        throw new Error(`Erro ao salvar matches: ${matchError.message}`)
      }

      // Update requirement status
      await supabase
        .from('requirements')
        .update({ status: 'matched' })
        .in('id', requirementIds)
    }

    return Response.json({
      success: true,
      matchedCount: matchesToInsert.length,
      totalRequirements: requirements.length,
    })
  } catch (error) {
    console.error('Auto-match error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar matching' },
      { status: 500 }
    )
  }
}
