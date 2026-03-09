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
import { Plus, Search, Truck, MoreHorizontal, Pencil, Trash2, Star, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Supplier } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/status-badge'

async function getSuppliers(search?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('suppliers')
    .select('*')
    .order('company_name')

  if (search) {
    query = query.or(`company_name.ilike.%${search}%,cnpj.ilike.%${search}%,location_city.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data as Supplier[]
}

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const suppliers = await getSuppliers(search)

  return (
    <AppShell>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores e distribuidores"
      >
        <Button asChild>
          <Link href="/fornecedores/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
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
              placeholder="Buscar por nome, CNPJ ou cidade..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        {/* Table */}
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Truck className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-medium text-foreground">
              Nenhum fornecedor cadastrado
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comece cadastrando seu primeiro fornecedor.
            </p>
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Fornecedor
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[150px]">CNPJ</TableHead>
                  <TableHead className="w-[150px]">Localização</TableHead>
                  <TableHead className="w-[100px]">Lead Time</TableHead>
                  <TableHead className="w-[80px]">Rating</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Link
                        href={`/fornecedores/${supplier.id}`}
                        className="font-medium hover:underline"
                      >
                        {supplier.company_name}
                      </Link>
                      {supplier.contact_name && (
                        <p className="text-xs text-muted-foreground">
                          {supplier.contact_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {supplier.cnpj || '-'}
                    </TableCell>
                    <TableCell>
                      {supplier.location_city && supplier.location_uf ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {supplier.location_city}/{supplier.location_uf}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.lead_time_days} dias
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {supplier.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={supplier.active ? 'success' : 'default'}>
                        {supplier.active ? 'Ativo' : 'Inativo'}
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
                            <Link href={`/fornecedores/${supplier.id}/editar`}>
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
