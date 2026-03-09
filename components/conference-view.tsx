'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge, getRequirementStatusVariant, getRequirementStatusLabel } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Sparkles, 
  Link as LinkIcon, 
  Check, 
  X, 
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import type { Requirement, Material, RequirementMatch } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ConferenceViewProps {
  projectId: string
  requirements: Requirement[]
  materials: Material[]
  matchesByRequirement: Record<string, RequirementMatch[]>
}

export function ConferenceView({
  projectId,
  requirements,
  materials,
  matchesByRequirement,
}: ConferenceViewProps) {
  const router = useRouter()
  const [isAutoMatching, setIsAutoMatching] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [materialSearch, setMaterialSearch] = useState('')

  const handleAutoMatch = useCallback(async () => {
    setIsAutoMatching(true)
    try {
      const response = await fetch('/api/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao realizar matching')
      }

      router.refresh()
    } catch (error) {
      console.error('Auto-match error:', error)
      alert(error instanceof Error ? error.message : 'Erro ao realizar matching automático')
    } finally {
      setIsAutoMatching(false)
    }
  }, [projectId, router])

  const handleManualMatch = useCallback(async (requirementId: string, materialId: string) => {
    try {
      const response = await fetch('/api/manual-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId, materialId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao associar')
      }

      setSelectedRequirement(null)
      router.refresh()
    } catch (error) {
      console.error('Manual match error:', error)
      alert(error instanceof Error ? error.message : 'Erro ao associar material')
    }
  }, [router])

  const handleApproveMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch('/api/approve-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status: 'approved' }),
      })

      if (!response.ok) {
        throw new Error('Erro ao aprovar')
      }

      router.refresh()
    } catch (error) {
      console.error('Approve error:', error)
    }
  }, [router])

  const handleRejectMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch('/api/approve-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status: 'rejected' }),
      })

      if (!response.ok) {
        throw new Error('Erro ao rejeitar')
      }

      router.refresh()
    } catch (error) {
      console.error('Reject error:', error)
    }
  }, [router])

  const filteredMaterials = materials.filter(m =>
    m.description.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.family.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.internal_code?.toLowerCase().includes(materialSearch.toLowerCase())
  )

  const getMatchStatus = (requirementId: string) => {
    const reqMatches = matchesByRequirement[requirementId]
    if (!reqMatches || reqMatches.length === 0) return 'unmatched'
    if (reqMatches.some(m => m.status === 'approved')) return 'approved'
    if (reqMatches.some(m => m.status === 'suggested')) return 'suggested'
    return 'rejected'
  }

  return (
    <div className="grid gap-6">
      {/* Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">Matching Automático com IA</CardTitle>
          <Button onClick={handleAutoMatch} disabled={isAutoMatching}>
            {isAutoMatching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Executar Auto-Match
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            O sistema irá analisar cada requisito extraído do memorial e buscar o material
            mais adequado no catálogo, considerando atributos técnicos, família e restrições.
          </p>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisitos vs Materiais</CardTitle>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>Nenhum requisito extraído.</p>
              <p className="text-sm">Volte ao projeto e faça upload de um memorial.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Requisito</TableHead>
                    <TableHead className="w-[120px]">Seção</TableHead>
                    <TableHead>Material Associado</TableHead>
                    <TableHead className="w-[100px]">Confiança</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req) => {
                    const matches = matchesByRequirement[req.id] || []
                    const primaryMatch = matches.find(m => m.status === 'approved') || matches[0]
                    const matchedMaterial = primaryMatch 
                      ? materials.find(m => m.id === primaryMatch.material_id)
                      : null
                    const status = getMatchStatus(req.id)

                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          <p className="font-medium">{req.generic_item}</p>
                          {req.application_location && (
                            <p className="text-xs text-muted-foreground">
                              Local: {req.application_location}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {req.section || '-'}
                        </TableCell>
                        <TableCell>
                          {matchedMaterial ? (
                            <div>
                              <p className="font-medium">{matchedMaterial.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {matchedMaterial.internal_code} | {matchedMaterial.family}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {primaryMatch && (
                            <span className="font-mono text-sm">
                              {Math.round(primaryMatch.match_confidence * 100)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status === 'approved' && (
                            <StatusBadge variant="success">Aprovado</StatusBadge>
                          )}
                          {status === 'suggested' && (
                            <StatusBadge variant="warning">Sugerido</StatusBadge>
                          )}
                          {status === 'unmatched' && (
                            <StatusBadge variant="error">Gap</StatusBadge>
                          )}
                          {status === 'rejected' && (
                            <StatusBadge variant="default">Rejeitado</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {primaryMatch && primaryMatch.status === 'suggested' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-success"
                                  onClick={() => handleApproveMatch(primaryMatch.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRejectMatch(primaryMatch.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setSelectedRequirement(req)}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Associar Material</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4">
                                  <div className="rounded-lg bg-muted p-3">
                                    <p className="text-sm font-medium">{req.generic_item}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {req.section} | {req.application_location}
                                    </p>
                                  </div>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      placeholder="Buscar material..."
                                      value={materialSearch}
                                      onChange={(e) => setMaterialSearch(e.target.value)}
                                      className="pl-9"
                                    />
                                  </div>
                                  <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
                                    {filteredMaterials.slice(0, 20).map((material) => (
                                      <button
                                        key={material.id}
                                        className="flex w-full items-center justify-between border-b border-border p-3 text-left hover:bg-muted last:border-0"
                                        onClick={() => handleManualMatch(req.id, material.id)}
                                      >
                                        <div>
                                          <p className="font-medium">{material.description}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {material.internal_code} | {material.family} | {material.unit}
                                          </p>
                                        </div>
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
