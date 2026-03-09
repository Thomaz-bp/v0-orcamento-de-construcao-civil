'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Upload, FileText, Sparkles, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import type { Memorial } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface MemorialUploadProps {
  projectId: string
  memorials: Memorial[]
}

export function MemorialUpload({ projectId, memorials }: MemorialUploadProps) {
  const router = useRouter()
  const [isExtracting, setIsExtracting] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleExtract = useCallback(async () => {
    if (!textContent.trim()) {
      setError('Cole o texto do memorial descritivo')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/extract-memorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          text: textContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao extrair memorial')
      }

      setTextContent('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsExtracting(false)
    }
  }, [projectId, textContent, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-info" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluído',
      error: 'Erro',
    }
    return labels[status] || status
  }

  return (
    <div className="grid gap-6">
      {/* Text Input */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Cole o texto do Memorial Descritivo</h3>
          <p className="text-xs text-muted-foreground">
            A IA irá extrair os requisitos técnicos automaticamente
          </p>
        </div>
        
        <Textarea
          placeholder="Cole aqui o texto do memorial descritivo...

Exemplo:
3.1 INSTALAÇÕES ELÉTRICAS
- Todos os cabos devem ser de cobre flexível, seção mínima 2,5mm², certificação INMETRO
- Disjuntores termomagnéticos marca Siemens ou Schneider
- Tomadas 2P+T na cor branca, modelo padrão NBR 14136

3.2 INSTALAÇÕES HIDRÁULICAS  
- Tubos de PVC rígido soldável para água fria
- Registros de gaveta em latão cromado
- Válvulas de descarga modelo Hydra ou similar..."
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleExtract} disabled={isExtracting || !textContent.trim()}>
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extraindo requisitos...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extrair Requisitos com IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Previous Memorials */}
      {memorials.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">Memoriais Processados</h3>
          <div className="grid gap-2">
            {memorials.map((memorial) => (
              <Card key={memorial.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {memorial.original_filename || 'Memorial de texto'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(memorial.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(memorial.extraction_status)}
                    <StatusBadge
                      variant={
                        memorial.extraction_status === 'completed'
                          ? 'success'
                          : memorial.extraction_status === 'error'
                          ? 'error'
                          : memorial.extraction_status === 'processing'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {getStatusLabel(memorial.extraction_status)}
                    </StatusBadge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
