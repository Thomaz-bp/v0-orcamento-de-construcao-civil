import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Material } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/status-badge'

async function getMaterials(search?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`description.ilike.%${search}%,internal_code.ilike.%${search}%,family.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching materials:', error)
    return []
  }

  return data as Material[]
}

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const materials = await getMaterials(search)

  return (
    <AppShell>
      <PageHeader
        title="Materiais"
        description="Catálogo de materiais de construção"
      >
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/materiais/novo">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Material</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <form className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Buscar materiais..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        {/* Content */}
        {materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
            <Package className="mb-4 h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
            <h3 className="mb-1 text-base font-medium text-foreground sm:text-lg">
              Nenhum material cadastrado
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comece cadastrando seu primeiro material.
            </p>
            <Button asChild>
              <Link href="/materiais/novo">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Material
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid gap-3 sm:hidden">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/materiais/${material.id}`}
                          className="block truncate font-medium text-foreground hover:underline"
                        >
                          {material.description}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {material.internal_code && (
                            <span className="font-mono">{material.internal_code}</span>
                          )}
                          <span>•</span>
                          <span>{material.unit}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <StatusBadge variant="info">{material.family}</StatusBadge>
                          <StatusBadge variant={material.active ? 'success' : 'default'}>
                            {material.active ? 'Ativo' : 'Inativo'}
                          </StatusBadge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/materiais/${material.id}/editar`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden rounded-lg border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px]">Família</TableHead>
                    <TableHead className="w-[80px]">Unidade</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-mono text-xs">
                        {material.internal_code || '-'}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/materiais/${material.id}`}
                          className="font-medium hover:underline"
                        >
                          {material.description}
                        </Link>
                        {material.subfamily && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({material.subfamily})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant="info">{material.family}</StatusBadge>
                      </TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>
                        <StatusBadge variant={material.active ? 'success' : 'default'}>
                          {material.active ? 'Ativo' : 'Inativo'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/materiais/${material.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
