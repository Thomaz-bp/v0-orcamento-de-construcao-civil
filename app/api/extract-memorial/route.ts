import { createAdminClient } from '@/lib/supabase/admin'
import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

interface ExtractedRequirement {
  section: string
  application_location: string
  generic_item: string
  attributes: Record<string, string>
  restrictions: Record<string, string>
  source_excerpt: string
  confidence: number
}

interface ExtractionResponse {
  requirements: ExtractedRequirement[]
  summary: string
}

export async function POST(request: Request) {
  try {
    const { projectId, text } = await request.json()

    if (!projectId || !text) {
      return Response.json({ error: 'projectId e text são obrigatórios' }, { status: 400 })
    }

    const supabase = createAdminClient()

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
      const { text: aiResponse } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `Você é um especialista em orçamentos de construção civil.
Analise o seguinte memorial descritivo e extraia todos os requisitos técnicos de materiais.

Responda APENAS com um JSON válido no seguinte formato (sem texto adicional):
{
  "requirements": [
    {
      "section": "Seção ou capítulo do memorial",
      "application_location": "Local de aplicação",
      "generic_item": "Descrição do material",
      "attributes": {"chave": "valor"},
      "restrictions": {"chave": "valor"},
      "source_excerpt": "Trecho original do texto",
      "confidence": 0.9
    }
  ],
  "summary": "Resumo do memorial"
}

MEMORIAL DESCRITIVO:
${text}`,
      })
      
      // Parse the JSON response
      let object: ExtractionResponse
      try {
        // Extract JSON from response (handle potential markdown code blocks)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Não foi possível encontrar JSON na resposta')
        }
        object = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        throw new Error('Erro ao processar resposta da IA: formato inválido')
      }

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
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar memorial' },
      { status: 500 }
    )
  }
}
