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
        <Button asChild>
          <Link href="/materiais/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Material
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        {/* Search */}
        <div className="mb-6 flex items-center gap-4">
          <form className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Buscar por descrição, código ou família..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        {/* Table */}
        {materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-medium text-foreground">
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
          <div className="rounded-lg border border-border">
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
        )}
      </div>
    </AppShell>
  )
}
