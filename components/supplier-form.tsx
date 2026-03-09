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
import type { Supplier } from '@/lib/types'
import { useState } from 'react'

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

interface SupplierFormProps {
  supplier?: Supplier
  action: (formData: FormData) => Promise<{ error?: string } | void>
}

export function SupplierForm({ supplier, action }: SupplierFormProps) {
  const [active, setActive] = useState(supplier?.active ?? true)

  return (
    <form action={action} className="mx-auto max-w-3xl">
      <input type="hidden" name="active" value={active.toString()} />

      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fornecedores">
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
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Razão Social *</Label>
              <Input
                id="company_name"
                name="company_name"
                placeholder="Nome da empresa"
                required
                defaultValue={supplier?.company_name || ''}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  defaultValue={supplier?.cnpj || ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Avaliação (0-5)</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.0"
                  defaultValue={supplier?.rating || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="Nome do responsável"
                defaultValue={supplier?.contact_name || ''}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  defaultValue={supplier?.email || ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  defaultValue={supplier?.phone || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localização</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="location_uf">Estado (UF)</Label>
                <Select name="location_uf" defaultValue={supplier?.location_uf || ''}>
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
                  defaultValue={supplier?.location_city || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condições Comerciais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Condições Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lead_time_days">Lead Time (dias)</Label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  min="1"
                  placeholder="7"
                  defaultValue={supplier?.lead_time_days || '7'}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_terms">Condições de Pagamento</Label>
              <Textarea
                id="payment_terms"
                name="payment_terms"
                placeholder="Ex: 30/60/90 dias, boleto, etc."
                defaultValue={supplier?.payment_terms || ''}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
