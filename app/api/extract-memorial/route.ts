import { createClient } from '@/lib/supabase/server'
import { createGroq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const RequirementSchema = z.object({
  section: z.string().describe('Seção ou capítulo do memorial (ex: "3.1 Instalações Elétricas")'),
  application_location: z.string().describe('Local de aplicação do material (ex: "Banheiros", "Área Externa")'),
  generic_item: z.string().describe('Descrição genérica do item/material requerido'),
  attributes: z.record(z.string()).describe('Atributos técnicos extraídos (ex: {seção_mm2: "2.5", material: "cobre"})'),
  restrictions: z.record(z.string()).describe('Restrições ou exigências (ex: {certificacao: "INMETRO", marca: "Tigre ou similar"})'),
  source_excerpt: z.string().describe('Trecho original do texto que originou este requisito'),
  confidence: z.number().min(0).max(1).describe('Nível de confiança na extração (0-1)'),
})

const ExtractionResponseSchema = z.object({
  requirements: z.array(RequirementSchema),
  summary: z.string().describe('Resumo geral do memorial'),
})

export async function POST(request: Request) {
  try {
    const { projectId, text } = await request.json()

    if (!projectId || !text) {
      return Response.json({ error: 'projectId e text são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    // Create memorial record
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .insert({
        project_id: projectId,
        extracted_text: text,
        original_filename: 'Memorial de texto',
        extraction_status: 'processing',
      })
      .select()
      .single()

    if (memorialError) {
      return Response.json({ error: memorialError.message }, { status: 500 })
    }

    try {
      // Extract requirements using AI
      const { object } = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        schema: ExtractionResponseSchema,
        prompt: `Você é um especialista em orçamentos de construção civil.
Analise o seguinte memorial descritivo e extraia todos os requisitos técnicos de materiais.

Para cada requisito identificado, extraia:
- Seção/capítulo de onde veio
- Local de aplicação (se mencionado)
- Item genérico (descrição do material)
- Atributos técnicos (dimensões, especificações, normas)
- Restrições (marcas aprovadas, certificações exigidas)
- Trecho original do texto

Seja preciso e mantenha rastreabilidade com o texto original.

MEMORIAL DESCRITIVO:
${text}`,
      })

      // Insert requirements
      if (object.requirements.length > 0) {
        const requirementsToInsert = object.requirements.map((req) => ({
          memorial_id: memorial.id,
          section: req.section,
          application_location: req.application_location,
          generic_item: req.generic_item,
          attributes_json: req.attributes,
          restrictions_json: req.restrictions,
          source_excerpt: req.source_excerpt,
          confidence_score: req.confidence,
          status: 'pending',
        }))

        const { error: reqError } = await supabase
          .from('requirements')
          .insert(requirementsToInsert)

        if (reqError) {
          throw new Error(`Erro ao salvar requisitos: ${reqError.message}`)
        }
      }

      // Update memorial status
      await supabase
        .from('memorials')
        .update({ extraction_status: 'completed' })
        .eq('id', memorial.id)

      return Response.json({
        success: true,
        memorialId: memorial.id,
        requirementsCount: object.requirements.length,
        summary: object.summary,
      })
    } catch (aiError) {
      // Update memorial status to error
      await supabase
        .from('memorials')
        .update({ extraction_status: 'error' })
        .eq('id', memorial.id)

      throw aiError
    }
  } catch (error) {
    console.error('Error extracting memorial:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar memorial' },
      { status: 500 }
    )
  }
}
