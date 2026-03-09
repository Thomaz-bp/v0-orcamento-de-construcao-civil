"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Calculator, Shield, Database, Plus, Trash2 } from "lucide-react"
import type { TechnicalRule, MaterialFamily } from "@/lib/types"

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [families, setFamilies] = useState<MaterialFamily[]>([])
  const [rules, setRules] = useState<TechnicalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Default business rules state
  const [defaultBdi, setDefaultBdi] = useState(25)
  const [defaultMargin, setDefaultMargin] = useState(10)
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [familiesRes, rulesRes] = await Promise.all([
      supabase.from("material_families").select("*").order("name"),
      supabase.from("technical_rules").select("*").order("family")
    ])

    if (familiesRes.data) setFamilies(familiesRes.data)
    if (rulesRes.data) setRules(rulesRes.data)
    setLoading(false)
  }

  async function toggleRuleActive(ruleId: string, active: boolean) {
    await supabase
      .from("technical_rules")
      .update({ active })
      .eq("id", ruleId)
    
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, active } : r
    ))
  }

  async function deleteRule(ruleId: string) {
    await supabase
      .from("technical_rules")
      .delete()
      .eq("id", ruleId)
    
    setRules(rules.filter(r => r.id !== ruleId))
  }

  return (
    <AppShell>
      <PageHeader
        title="Configurações"
        description="Configure regras de negócio, parâmetros fiscais e técnicos"
      />

      <Tabs defaultValue="negocio" className="space-y-6">
        <TabsList>
          <TabsTrigger value="negocio">Regras de Negócio</TabsTrigger>
          <TabsTrigger value="tecnicas">Regras Técnicas</TabsTrigger>
          <TabsTrigger value="familias">Famílias de Materiais</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="negocio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Parâmetros Padrão
              </CardTitle>
              <CardDescription>
                Valores padrão aplicados a novos projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultBdi">BDI Padrão (%)</Label>
                  <Input
                    id="defaultBdi"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultBdi}
                    onChange={(e) => setDefaultBdi(parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonificação e Despesas Indiretas aplicado sobre custos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultMargin">Margem Padrão (%)</Label>
                  <Input
                    id="defaultMargin"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultMargin}
                    onChange={(e) => setDefaultMargin(parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Margem de lucro sobre valor com BDI
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Condições de Pagamento Padrão</Label>
                <Textarea
                  id="paymentTerms"
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                  placeholder="Ex: 30/60/90 dias, 50% entrada + 50% na entrega, etc."
                  rows={3}
                />
              </div>

              <Button disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnicas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Regras de Validação Técnica
              </CardTitle>
              <CardDescription>
                Regras automáticas para validar materiais por família
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Família</TableHead>
                      <TableHead>Atributo</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {rule.family}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {rule.attribute}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.operator}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {JSON.stringify(rule.required_value)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={rule.severity === "error" ? "destructive" : "secondary"}
                          >
                            {rule.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRuleActive(rule.id, !rule.active)}
                          >
                            {rule.active ? (
                              <Badge variant="default">Ativo</Badge>
                            ) : (
                              <Badge variant="outline">Inativo</Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="mt-4">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Regra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="familias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Famílias de Materiais
              </CardTitle>
              <CardDescription>
                Categorias para organização do catálogo de materiais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {families.map((family) => (
                    <Card key={family.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{family.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {family.description || "Sem descrição"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Família
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Versão</Label>
                  <p className="font-mono">1.0.0</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ambiente</Label>
                  <p className="font-mono">Produção</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Banco de Dados</Label>
                  <p className="font-mono">Supabase PostgreSQL</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IA para Extração</Label>
                  <p className="font-mono">Groq (Llama 3.3)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
