'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  client_name: string | null
}

interface ApprovedItem {
  requirementId: string
  materialId: string
  materialDescription: string
  materialCode: string | null
  unit: string
  genericItem: string
}

interface RfqFormProps {
  projects: Project[]
  action: (formData: FormData) => Promise<{ error?: string } | void>
}

export function RfqForm({ projects, action }: RfqFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [approvedItems, setApprovedItems] = useState<ApprovedItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number }>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedProjectId) {
      loadApprovedItems(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadApprovedItems = async (projectId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/project-approved-items?projectId=${projectId}`)
      const data = await response.json()
      setApprovedItems(data.items || [])
      
      // Auto-select all items with default quantity of 1
      const newSelected = new Map<string, { quantity: number }>()
      data.items?.forEach((item: ApprovedItem) => {
        newSelected.set(item.requirementId, { quantity: 1 })
      })
      setSelectedItems(newSelected)
    } catch (error) {
      console.error('Error loading approved items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItem = (requirementId: string) => {
    const newSelected = new Map(selectedItems)
    if (newSelected.has(requirementId)) {
      newSelected.delete(requirementId)
    } else {
      newSelected.set(requirementId, { quantity: 1 })
    }
    setSelectedItems(newSelected)
  }

  const updateQuantity = (requirementId: string, quantity: number) => {
    const newSelected = new Map(selectedItems)
    newSelected.set(requirementId, { quantity })
    setSelectedItems(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Add selected items as JSON
    const itemsArray = approvedItems
      .filter(item => selectedItems.has(item.requirementId))
      .map(item => ({
        materialId: item.materialId,
        requirementId: item.requirementId,
        quantity: selectedItems.get(item.requirementId)?.quantity || 1,
        unit: item.unit,
      }))
    
    formData.set('selected_items', JSON.stringify(itemsArray))
    
    await action(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" type="button" asChild>
          <Link href="/cotacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1" />
        <Button type="submit" disabled={selectedItems.size === 0}>
          <Save className="mr-2 h-4 w-4" />
          Criar RFQ
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da RFQ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project_id">Projeto *</Label>
              <Select 
                name="project_id" 
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {project.client_name && ` - ${project.client_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Título da RFQ *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Cotação Materiais Elétricos - Fase 1"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="deadline">Prazo para Respostas</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Condições especiais, requisitos de entrega, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Itens para Cotação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Itens para Cotação
              {selectedItems.size > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedItems.size} selecionados)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedProjectId ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Selecione um projeto para ver os itens aprovados.
              </p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : approvedItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum item aprovado neste projeto. Complete a conferência comparativa primeiro.
              </p>
            ) : (
              <div className="rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left font-medium">Material</th>
                      <th className="w-[100px] px-3 py-2 text-left font-medium">Código</th>
                      <th className="w-[100px] px-3 py-2 text-left font-medium">Quantidade</th>
                      <th className="w-[80px] px-3 py-2 text-left font-medium">Unidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedItems.map((item) => (
                      <tr key={item.requirementId} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selectedItems.has(item.requirementId)}
                            onCheckedChange={() => toggleItem(item.requirementId)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.materialDescription}</p>
                          <p className="text-xs text-muted-foreground">{item.genericItem}</p>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {item.materialCode || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={selectedItems.get(item.requirementId)?.quantity || ''}
                            onChange={(e) => updateQuantity(item.requirementId, parseFloat(e.target.value) || 1)}
                            disabled={!selectedItems.has(item.requirementId)}
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="px-3 py-2">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
