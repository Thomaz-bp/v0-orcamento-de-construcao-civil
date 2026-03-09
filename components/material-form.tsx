'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import type { Material } from '@/lib/types'
import { useState } from 'react'

const UNITS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'm²', label: 'Metro Quadrado (m²)' },
  { value: 'm³', label: 'Metro Cúbico (m³)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'pç', label: 'Peça (pç)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'sc', label: 'Saco (sc)' },
  { value: 'vb', label: 'Verba (vb)' },
]

interface MaterialFormProps {
  material?: Material
  families: string[]
  action: (formData: FormData) => Promise<{ error?: string } | void>
}

export function MaterialForm({ material, families, action }: MaterialFormProps) {
  const [active, setActive] = useState(material?.active ?? true)
  const [technicalAttrs, setTechnicalAttrs] = useState<Record<string, string>>(
    material?.technical_attributes_json as Record<string, string> || {}
  )
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrValue, setNewAttrValue] = useState('')

  const addAttribute = () => {
    if (newAttrKey && newAttrValue) {
      setTechnicalAttrs(prev => ({ ...prev, [newAttrKey]: newAttrValue }))
      setNewAttrKey('')
      setNewAttrValue('')
    }
  }

  const removeAttribute = (key: string) => {
    setTechnicalAttrs(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <form action={action} className="mx-auto max-w-3xl">
      <input type="hidden" name="active" value={active.toString()} />
      <input type="hidden" name="technical_attributes" value={JSON.stringify(technicalAttrs)} />

      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/materiais">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Label htmlFor="active" className="text-sm">Ativo</Label>
          <Switch
            id="active"
            checked={active}
            onCheckedChange={setActive}
          />
        </div>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="internal_code">Código Interno</Label>
                <Input
                  id="internal_code"
                  name="internal_code"
                  placeholder="Ex: MAT-001"
                  defaultValue={material?.internal_code || ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unidade *</Label>
                <Select name="unit" defaultValue={material?.unit || 'un'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição completa do material..."
                required
                defaultValue={material?.description || ''}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="family">Família *</Label>
                <Select name="family" defaultValue={material?.family || ''} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a família..." />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map(family => (
                      <SelectItem key={family} value={family}>
                        {family}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subfamily">Subfamília</Label>
                <Input
                  id="subfamily"
                  name="subfamily"
                  placeholder="Ex: Cabos flexíveis"
                  defaultValue={material?.subfamily || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atributos Técnicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atributos Técnicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {Object.entries(technicalAttrs).length > 0 && (
              <div className="rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Atributo</th>
                      <th className="px-3 py-2 text-left font-medium">Valor</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(technicalAttrs).map(([key, value]) => (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{key}</td>
                        <td className="px-3 py-2">{value}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttribute(key)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Nome do atributo"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Valor"
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addAttribute}>
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione atributos técnicos como tensão, pressão, resistência, etc.
            </p>
          </CardContent>
        </Card>

        {/* Marcas Aprovadas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marcas Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="approved_brands">Marcas (separadas por vírgula)</Label>
              <Input
                id="approved_brands"
                name="approved_brands"
                placeholder="Tigre, Amanco, Fortlev"
                defaultValue={material?.approved_brands_json?.join(', ') || ''}
              />
              <p className="text-xs text-muted-foreground">
                Liste as marcas aprovadas para este material.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
