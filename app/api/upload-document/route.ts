import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Schema for extracted requirements from memorial
const RequirementsSchema = z.object({
  requirements: z.array(z.object({
    section: z.string().describe('Seção do memorial (ex: "3.1 INSTALAÇÕES ELÉTRICAS")'),
    application_location: z.string().optional().describe('Local de aplicação (ex: "Banheiros", "Área externa")'),
    generic_item: z.string().describe('Descrição genérica do item/material'),
    attributes: z.record(z.string()).optional().describe('Atributos técnicos extraídos'),
    restrictions: z.record(z.string()).optional().describe('Restrições ou marcas especificadas'),
    source_excerpt: z.string().describe('Trecho original do texto que gerou este requisito'),
    confidence: z.number().min(0).max(1).describe('Confiança da extração (0-1)'),
  }))
})

// Schema for spreadsheet items
const SpreadsheetSchema = z.object({
  items: z.array(z.object({
    description: z.string(),
    unit: z.string(),
    quantity: z.number(),
    family: z.string().optional(),
    attributes: z.record(z.string()).optional(),
  }))
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string
    const type = formData.get('type') as 'memorial' | 'spreadsheet'

    if (!file || !projectId || !type) {
      return NextResponse.json(
        { error: 'Arquivo, projeto e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Get file content as text
    const fileContent = await file.text()
    const fileName = file.name

    if (type === 'memorial') {
      // Process memorial document with AI
      return await processMemorial(supabase, projectId, fileName, fileContent)
    } else {
      // Process spreadsheet
      return await processSpreadsheet(supabase, projectId, fileName, fileContent)
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar arquivo' },
      { status: 500 }
    )
  }
}

async function processMemorial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  fileName: string,
  fileContent: string
) {
  // Create memorial record
  const { data: memorial, error: memorialError } = await supabase
    .from('memorials')
    .insert({
      project_id: projectId,
      original_filename: fileName,
      extracted_text: fileContent.substring(0, 50000), // Limit stored text
      extraction_status: 'processing',
    })
    .select()
    .single()

  if (memorialError) {
    return NextResponse.json(
      { error: 'Erro ao salvar memorial' },
      { status: 500 }
    )
  }

  try {
    // Extract requirements using AI
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: RequirementsSchema,
      prompt: `Você é um especialista em orçamentos de construção civil. Analise o memorial descritivo abaixo e extraia TODOS os requisitos técnicos de materiais.

Para cada requisito, identifique:
1. A seção do memorial onde está
2. O local de aplicação (se especificado)
3. Uma descrição genérica do item/material
4. Atributos técnicos (dimensões, especificações, normas)
5. Restrições (marcas aprovadas, certificações exigidas)
6. O trecho exato do texto original

MEMORIAL DESCRITIVO:
${fileContent.substring(0, 30000)}

Extraia o máximo de requisitos possível, mantendo fidelidade ao texto original.`,
    })

    // Insert requirements
    if (object.requirements.length > 0) {
      const requirementsToInsert = object.requirements.map(req => ({
        memorial_id: memorial.id,
        section: req.section,
        application_location: req.application_location || null,
        generic_item: req.generic_item,
        attributes_json: req.attributes || {},
        restrictions_json: req.restrictions || {},
        source_excerpt: req.source_excerpt,
        confidence_score: req.confidence,
        status: 'pending',
      }))

      await supabase.from('requirements').insert(requirementsToInsert)
    }

    // Update memorial status
    await supabase
      .from('memorials')
      .update({ extraction_status: 'completed' })
      .eq('id', memorial.id)

    return NextResponse.json({
      success: true,
      message: `${object.requirements.length} requisitos extraídos do memorial`,
      memorialId: memorial.id,
      requirementsCount: object.requirements.length,
    })
  } catch (aiError) {
    // Update memorial status to error
    await supabase
      .from('memorials')
      .update({ extraction_status: 'error' })
      .eq('id', memorial.id)

    throw aiError
  }
}

async function processSpreadsheet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  fileName: string,
  fileContent: string
) {
  // Create memorial record for tracking
  const { data: memorial, error: memorialError } = await supabase
    .from('memorials')
    .insert({
      project_id: projectId,
      original_filename: fileName,
      extracted_text: fileContent.substring(0, 10000),
      extraction_status: 'processing',
    })
    .select()
    .single()

  if (memorialError) {
    return NextResponse.json(
      { error: 'Erro ao salvar registro' },
      { status: 500 }
    )
  }

  try {
    // Use AI to parse the CSV/spreadsheet content
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: SpreadsheetSchema,
      prompt: `Você é um especialista em orçamentos de construção civil. Analise a planilha abaixo e extraia todos os itens de material.

A planilha está em formato CSV ou texto. Identifique as colunas e extraia:
1. Descrição do item/material
2. Unidade de medida (m, m², un, kg, etc.)
3. Quantidade
4. Família do material (Elétrica, Hidráulica, Estrutural, Revestimentos, etc.) - infira se não estiver explícito
5. Atributos técnicos que puder identificar na descrição

CONTEÚDO DA PLANILHA:
${fileContent.substring(0, 20000)}

Extraia todos os itens, ignorando linhas de cabeçalho ou totais.`,
    })

    // Insert items as requirements
    if (object.items.length > 0) {
      const requirementsToInsert = object.items.map(item => ({
        memorial_id: memorial.id,
        section: item.family || 'Geral',
        application_location: null,
        generic_item: item.description,
        attributes_json: {
          ...item.attributes,
          unit: item.unit,
          quantity: item.quantity,
        },
        restrictions_json: {},
        source_excerpt: `${item.description} - ${item.quantity} ${item.unit}`,
        confidence_score: 0.9,
        status: 'pending',
      }))

      await supabase.from('requirements').insert(requirementsToInsert)
    }

    // Update memorial status
    await supabase
      .from('memorials')
      .update({ extraction_status: 'completed' })
      .eq('id', memorial.id)

    return NextResponse.json({
      success: true,
      message: `${object.items.length} itens importados da planilha`,
      memorialId: memorial.id,
      itemsCount: object.items.length,
    })
  } catch (aiError) {
    // Update memorial status to error
    await supabase
      .from('memorials')
      .update({ extraction_status: 'error' })
      .eq('id', memorial.id)

    throw aiError
  }
}
