'use client'

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
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/types'

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

interface ProjectFormProps {
  project?: Project
  action: (formData: FormData) => Promise<{ error?: string } | void>
}

export function ProjectForm({ project, action }: ProjectFormProps) {
  return (
    <form action={action} className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projetos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1" />
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informações do Projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Edifício Comercial XYZ"
                required
                defaultValue={project?.name || ''}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição do projeto..."
                defaultValue={project?.description || ''}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_name">Cliente</Label>
              <Input
                id="client_name"
                name="client_name"
                placeholder="Nome do cliente"
                defaultValue={project?.client_name || ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localização da Obra</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="location_uf">Estado (UF)</Label>
                <Select name="location_uf" defaultValue={project?.location_uf || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map(uf => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location_city">Cidade</Label>
                <Input
                  id="location_city"
                  name="location_city"
                  placeholder="Nome da cidade"
                  defaultValue={project?.location_city || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="bdi_percentage">BDI (%)</Label>
                <Input
                  id="bdi_percentage"
                  name="bdi_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="25.00"
                  defaultValue={project?.bdi_percentage || '25'}
                />
                <p className="text-xs text-muted-foreground">
                  Benefícios e Despesas Indiretas
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="margin_percentage">Margem (%)</Label>
                <Input
                  id="margin_percentage"
                  name="margin_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="10.00"
                  defaultValue={project?.margin_percentage || '10'}
                />
                <p className="text-xs text-muted-foreground">
                  Margem de lucro sobre o custo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
