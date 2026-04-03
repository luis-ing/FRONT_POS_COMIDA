"use client"

import { useState, useEffect } from "react"
import { Banknote, CreditCard, Wallet, ArrowRightLeft, Ticket, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { getMetodosPago } from "@/services/catalogo_service"
import type { MetodoPagoResponse } from "@/types/schemas"
import type { CartItem } from "./catalog-view"

// Icono por nombre de método — fallback a Banknote
const METHOD_ICON: Record<string, React.ReactNode> = {
  "Efectivo":           <Banknote className="h-6 w-6" />,
  "Tarjeta de crédito": <CreditCard className="h-6 w-6" />,
  "Tarjeta de débito":  <Wallet className="h-6 w-6" />,
  "Transferencia":      <ArrowRightLeft className="h-6 w-6" />,
  "Vale / cupón":       <Ticket className="h-6 w-6" />,
}

const EFECTIVO_KEY = "Efectivo"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  total: number
  onConfirmPayment: (methodId: number, amountReceived?: number) => void | Promise<void>
  isClosingOrder?: boolean
}

export function PaymentModal({
  open,
  onOpenChange,
  items,
  total,
  onConfirmPayment,
  isClosingOrder = false,
}: PaymentModalProps) {
  // ── Métodos de pago ───────────────────────────────────────────────────────
  const [metodos,   setMetodos]   = useState<MetodoPagoResponse[]>([])
  const [loadingM,  setLoadingM]  = useState(true)

  useEffect(() => {
    if (!open) return
    setLoadingM(true)
    getMetodosPago()
      .then(setMetodos)
      .catch(() => toast.error("Error al cargar métodos de pago"))
      .finally(() => setLoadingM(false))
  }, [open])

  // ── Estado del pago ───────────────────────────────────────────────────────
  const [selectedId,      setSelectedId]      = useState<number | null>(null)
  const [amountReceived,  setAmountReceived]  = useState("")
  const [isProcessing,    setIsProcessing]    = useState(false)
  const [isSuccess,       setIsSuccess]       = useState(false)

  const selectedMethod  = metodos.find(m => m.id === selectedId)
  const isEfectivo      = selectedMethod?.metodo === EFECTIVO_KEY
  const amountNum       = parseFloat(amountReceived) || 0
  const change          = isEfectivo ? Math.max(0, amountNum - total) : 0
  const canProceed      = selectedId !== null &&
    (!isEfectivo || amountNum >= total)

  // Montos rápidos para efectivo
  const quickAmounts = [...new Set([
    Math.ceil(total / 10)  * 10,
    Math.ceil(total / 50)  * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
  ])].filter(v => v >= total).slice(0, 4)

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedId || !canProceed) return
    setIsProcessing(true)
    try {
      await onConfirmPayment(selectedId, isEfectivo ? amountNum : undefined)
      setIsSuccess(true)
      await new Promise(r => setTimeout(r, 1500))
      handleClose()
    } catch {
      // El error ya fue manejado en el caller (open-orders-view o catalog-view)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    setAmountReceived("")
    setIsProcessing(false)
    setIsSuccess(false)
    onOpenChange(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border-2 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isClosingOrder ? "Cerrar orden" : "Cobrar venta"}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          // ── Pantalla de éxito ─────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Pago completado</h3>
            <p className="text-muted-foreground">La venta se ha registrado correctamente</p>
            {change > 0 && (
              <div className="mt-4 rounded-xl bg-primary/10 px-6 py-3 text-center">
                <p className="text-sm text-muted-foreground">Cambio a entregar</p>
                <p className="text-2xl font-bold text-primary">${change.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          // ── Formulario de pago ────────────────────────────────────────────
          <div className="space-y-6">
            {/* Resumen */}
            <div className="rounded-xl border-2 border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">Productos</span>
                <span className="font-medium">{items.length} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Total a cobrar</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Método de pago</Label>
              {loadingM ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {metodos.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(m.id)
                        if (m.metodo !== EFECTIVO_KEY) setAmountReceived("")
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        selectedId === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "text-muted-foreground",
                        selectedId === m.id && "text-primary"
                      )}>
                        {METHOD_ICON[m.metodo] ?? <Banknote className="h-6 w-6" />}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedId === m.id && "text-primary"
                      )}>
                        {m.metodo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Monto efectivo */}
            {isEfectivo && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Monto recibido</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  className="h-14 rounded-xl border-2 text-center text-2xl font-bold"
                />
                {/* Montos rápidos */}
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      className="rounded-xl border-2"
                      onClick={() => setAmountReceived(String(amount))}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                {/* Cambio */}
                {amountNum >= total && (
                  <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                    <span className="font-medium">Cambio</span>
                    <span className="text-2xl font-bold text-primary">${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl border-2"
                onClick={handleClose}
                disabled={isProcessing}
              >
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button
                className="h-12 flex-1 rounded-xl"
                onClick={handleConfirm}
                disabled={!canProceed || isProcessing}
              >
                {isProcessing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                  : <><Check className="mr-2 h-4 w-4" /> Confirmar pago</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}