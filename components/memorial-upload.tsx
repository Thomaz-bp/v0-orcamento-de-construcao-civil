'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileSpreadsheet,
  X,
  File
} from 'lucide-react'
import type { Memorial } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface MemorialUploadProps {
  projectId: string
  memorials: Memorial[]
}

export function MemorialUpload({ projectId, memorials }: MemorialUploadProps) {
  const router = useRouter()
  const [isExtracting, setIsExtracting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // File upload states
  const [memorialFile, setMemorialFile] = useState<File | null>(null)
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const memorialInputRef = useRef<HTMLInputElement>(null)
  const spreadsheetInputRef = useRef<HTMLInputElement>(null)

  const handleExtract = useCallback(async () => {
    if (!textContent.trim()) {
      setError('Cole o texto do memorial descritivo')
      return
    }

    setIsExtracting(true)
    setError(null)
    setSuccess(null)

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
      setSuccess(`${data.requirementsCount || 0} requisitos extraídos com sucesso!`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsExtracting(false)
    }
  }, [projectId, textContent, router])

  const handleFileUpload = useCallback(async (type: 'memorial' | 'spreadsheet') => {
    const file = type === 'memorial' ? memorialFile : spreadsheetFile
    
    if (!file) {
      setError(`Selecione um arquivo ${type === 'memorial' ? 'de memorial' : 'de planilha'}`)
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      formData.append('type', type)

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar arquivo')
      }

      if (type === 'memorial') {
        setMemorialFile(null)
        if (memorialInputRef.current) memorialInputRef.current.value = ''
      } else {
        setSpreadsheetFile(null)
        if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = ''
      }

      setSuccess(data.message || 'Arquivo processado com sucesso!')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsUploading(false)
    }
  }, [projectId, memorialFile, spreadsheetFile, router])

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="grid gap-6">
      {/* Feedback messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Memorial
          </TabsTrigger>
          <TabsTrigger value="spreadsheet" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Planilha Orçamento
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <FileText className="h-4 w-4" />
            Colar Texto
          </TabsTrigger>
        </TabsList>

        {/* Upload Memorial PDF */}
        <TabsContent value="upload" className="mt-4">
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Upload do Memorial Descritivo</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Faça upload de um arquivo PDF ou Word com o memorial descritivo. A IA irá extrair os requisitos técnicos automaticamente.
              </p>
            </div>

            <div 
              className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file && (file.type === 'application/pdf' || file.type.includes('word'))) {
                  setMemorialFile(file)
                }
              }}
            >
              <input
                ref={memorialInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setMemorialFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center py-8">
                <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF ou Word (máx. 10MB)</p>
              </div>
            </div>

            {memorialFile && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{memorialFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(memorialFile.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMemorialFile(null)
                      if (memorialInputRef.current) memorialInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={() => handleFileUpload('memorial')} 
                disabled={isUploading || !memorialFile}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
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
        </TabsContent>

        {/* Upload Spreadsheet */}
        <TabsContent value="spreadsheet" className="mt-4">
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Upload da Planilha de Orçamento</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Faça upload de uma planilha Excel ou CSV com os itens do orçamento. O sistema irá importar os materiais e quantidades.
              </p>
            </div>

            <div 
              className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file && (file.type.includes('sheet') || file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
                  setSpreadsheetFile(file)
                }
              }}
            >
              <input
                ref={spreadsheetInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSpreadsheetFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center py-8">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Excel ou CSV (máx. 10MB)</p>
              </div>
            </div>

            {spreadsheetFile && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium">{spreadsheetFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(spreadsheetFile.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSpreadsheetFile(null)
                      if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2">Formato esperado da planilha:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-left">Unidade</th>
                        <th className="p-2 text-left">Quantidade</th>
                        <th className="p-2 text-left">Família</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">1</td>
                        <td className="p-2 text-muted-foreground">Cabo flexível 2,5mm²</td>
                        <td className="p-2 text-muted-foreground">m</td>
                        <td className="p-2 text-muted-foreground">500</td>
                        <td className="p-2 text-muted-foreground">Elétrica</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-muted-foreground">2</td>
                        <td className="p-2 text-muted-foreground">Tubo PVC 50mm</td>
                        <td className="p-2 text-muted-foreground">m</td>
                        <td className="p-2 text-muted-foreground">200</td>
                        <td className="p-2 text-muted-foreground">Hidráulica</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => handleFileUpload('spreadsheet')} 
                disabled={isUploading || !spreadsheetFile}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Planilha
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Text Input */}
        <TabsContent value="text" className="mt-4">
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Cole o texto do Memorial Descritivo</h3>
              <p className="text-xs text-muted-foreground mb-4">
                A IA irá extrair os requisitos técnicos automaticamente do texto colado.
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
        </TabsContent>
      </Tabs>

      {/* Previous Memorials */}
      {memorials.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">Documentos Processados</h3>
          <div className="grid gap-2">
            {memorials.map((memorial) => (
              <Card key={memorial.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {memorial.original_filename?.includes('.xls') || memorial.original_filename?.includes('.csv') ? (
                      <FileSpreadsheet className="h-5 w-5 text-success" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
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
