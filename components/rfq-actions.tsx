'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Send, 
  CheckCircle, 
  Loader2,
  Mail,
  Building2,
} from 'lucide-react'

interface Supplier {
  id: string
  company_name: string
  email: string | null
  location_uf: string | null
  location_city: string | null
}

interface RfqActionsProps {
  rfqId: string
  rfqStatus: string
  suppliers: Supplier[]
  canClose: boolean
  projectId?: string
}

export function RfqActions({
  rfqId,
  rfqStatus,
  suppliers,
  canClose,
  projectId,
}: RfqActionsProps) {
  const router = useRouter()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set())
  const [isSending, setIsSending] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleSendRfq = async () => {
    if (selectedSuppliers.size === 0) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierIds: Array.from(selectedSuppliers),
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar RFQ')
      }

      setSendDialogOpen(false)
      setSelectedSuppliers(new Set())
      router.refresh()
    } catch (error) {
      console.error('Error sending RFQ:', error)
      alert('Erro ao enviar RFQ para fornecedores')
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseRfq = async () => {
    setIsClosing(true)
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })

      if (!response.ok) {
        throw new Error('Erro ao fechar RFQ')
      }

      setCloseDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error closing RFQ:', error)
      alert('Erro ao fechar RFQ')
    } finally {
      setIsClosing(false)
    }
  }

  const handleChangeStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const toggleSupplier = (supplierId: string) => {
    const newSelected = new Set(selectedSuppliers)
    if (newSelected.has(supplierId)) {
      newSelected.delete(supplierId)
    } else {
      newSelected.add(supplierId)
    }
    setSelectedSuppliers(newSelected)
  }

  const selectAllSuppliers = () => {
    if (selectedSuppliers.size === suppliers.length) {
      setSelectedSuppliers(new Set())
    } else {
      setSelectedSuppliers(new Set(suppliers.map(s => s.id)))
    }
  }

  const suppliersWithEmail = suppliers.filter(s => s.email)

  return (
    <>
      <Card className="mb-4 sm:mb-6">
        <CardContent className="flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4">
          {rfqStatus === 'draft' && (
            <>
              <Button
                size="sm"
                onClick={() => setSendDialogOpen(true)}
                disabled={suppliers.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar para Fornecedores
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangeStatus('collecting')}
              >
                Iniciar Coleta Manual
              </Button>
            </>
          )}

          {rfqStatus === 'sent' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeStatus('collecting')}
            >
              Marcar como Coletando
            </Button>
          )}

          {(rfqStatus === 'collecting' || rfqStatus === 'sent') && (
            <Button
              size="sm"
              variant={canClose ? 'default' : 'outline'}
              onClick={() => setCloseDialogOpen(true)}
              disabled={!canClose}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Fechar Cotação
            </Button>
          )}

          {rfqStatus === 'closed' && projectId && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              Cotação fechada - pronta para orçamento
            </div>
          )}

          <div className="flex-1" />

          <span className="text-xs text-muted-foreground">
            {suppliers.length} fornecedores disponíveis
          </span>
        </CardContent>
      </Card>

      {/* Send RFQ Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar RFQ para Fornecedores</DialogTitle>
            <DialogDescription>
              Selecione os fornecedores que receberão a solicitação de cotação.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            <div className="sticky top-0 flex items-center gap-2 border-b border-border bg-background pb-2">
              <Checkbox
                checked={selectedSuppliers.size === suppliers.length && suppliers.length > 0}
                onCheckedChange={selectAllSuppliers}
              />
              <span className="text-sm font-medium">
                Selecionar todos ({suppliers.length})
              </span>
            </div>

            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center gap-3 rounded-md border border-border p-3"
              >
                <Checkbox
                  checked={selectedSuppliers.has(supplier.id)}
                  onCheckedChange={() => toggleSupplier(supplier.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-medium">{supplier.company_name}</p>
                  </div>
                  {supplier.email ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-warning">Sem email cadastrado</p>
                  )}
                  {supplier.location_city && (
                    <p className="text-xs text-muted-foreground">
                      {supplier.location_city}/{supplier.location_uf}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {suppliers.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhum fornecedor cadastrado</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendRfq}
              disabled={selectedSuppliers.size === 0 || isSending}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar para {selectedSuppliers.size} fornecedor(es)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close RFQ Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Cotação</DialogTitle>
            <DialogDescription>
              Ao fechar a cotação, os fornecedores selecionados serão confirmados e a RFQ 
              não poderá mais receber novas cotações. Os valores serão usados para gerar o orçamento.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseRfq} disabled={isClosing}>
              {isClosing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar e Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
