import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
        description="Cadastro de fornecedores"
      >
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/fornecedores/novo">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Fornecedor</span>
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
              placeholder="Buscar fornecedores..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        {/* Content */}
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
            <Truck className="mb-4 h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
            <h3 className="mb-1 text-base font-medium text-foreground sm:text-lg">
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
          <>
            {/* Mobile Cards */}
            <div className="grid gap-3 sm:hidden">
              {suppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/fornecedores/${supplier.id}`}
                          className="block truncate font-medium text-foreground hover:underline"
                        >
                          {supplier.company_name}
                        </Link>
                        {supplier.contact_name && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {supplier.contact_name}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {supplier.location_city && supplier.location_uf && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {supplier.location_city}/{supplier.location_uf}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {supplier.rating.toFixed(1)}
                          </span>
                          <span>{supplier.lead_time_days} dias</span>
                        </div>
                        <div className="mt-2">
                          <StatusBadge variant={supplier.active ? 'success' : 'default'}>
                            {supplier.active ? 'Ativo' : 'Inativo'}
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
          </>
        )}
      </div>
    </AppShell>
  )
}
