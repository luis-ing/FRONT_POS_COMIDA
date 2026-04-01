"use client"

import { useState } from "react"
import {
  Banknote,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Ticket,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CartItem } from "./catalog-view"

interface PaymentMethod {
  id: number
  nombre: string
  icon: React.ReactNode
}

const paymentMethods: PaymentMethod[] = [
  { id: 1, nombre: "Efectivo", icon: <Banknote className="h-6 w-6" /> },
  { id: 2, nombre: "Tarjeta de crédito", icon: <CreditCard className="h-6 w-6" /> },
  { id: 3, nombre: "Tarjeta de débito", icon: <Wallet className="h-6 w-6" /> },
  { id: 4, nombre: "Transferencia", icon: <ArrowRightLeft className="h-6 w-6" /> },
  { id: 5, nombre: "Vale / cupón", icon: <Ticket className="h-6 w-6" /> },
]

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  total: number
  onConfirmPayment: (methodId: number, amountReceived?: number) => void
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
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null)
  const [amountReceived, setAmountReceived] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const change = selectedMethod === 1 && amountReceived 
    ? Math.max(0, parseFloat(amountReceived) - total) 
    : 0

  const canProceed = selectedMethod !== null && 
    (selectedMethod !== 1 || (amountReceived && parseFloat(amountReceived) >= total))

  const handleConfirm = async () => {
    if (!selectedMethod || !canProceed) return
    
    setIsProcessing(true)
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsProcessing(false)
    setIsSuccess(true)
    
    // Show success briefly then close
    await new Promise(resolve => setTimeout(resolve, 1500))
    onConfirmPayment(selectedMethod, selectedMethod === 1 ? parseFloat(amountReceived) : undefined)
    handleClose()
  }

  const handleClose = () => {
    setSelectedMethod(null)
    setAmountReceived("")
    setIsProcessing(false)
    setIsSuccess(false)
    onOpenChange(false)
  }

  const quickAmounts = [
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border-2 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isClosingOrder ? "Cerrar orden" : "Cobrar venta"}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Pago completado</h3>
            <p className="text-muted-foreground">La venta se ha registrado correctamente</p>
            {change > 0 && (
              <div className="mt-4 rounded-xl bg-primary/10 px-6 py-3">
                <p className="text-sm text-muted-foreground">Cambio a entregar</p>
                <p className="text-2xl font-bold text-primary">${change.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
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

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Método de pago</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id)
                      if (method.id !== 1) setAmountReceived("")
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "text-muted-foreground",
                      selectedMethod === method.id && "text-primary"
                    )}>
                      {method.icon}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      selectedMethod === method.id && "text-primary"
                    )}>
                      {method.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Amount Input */}
            {selectedMethod === 1 && (
              <div className="space-y-3">
                <Label htmlFor="amountReceived" className="text-base font-medium">
                  Monto recibido
                </Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="h-14 rounded-xl border-2 text-2xl font-bold text-center"
                />
                
                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.slice(0, 4).map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      className="rounded-xl border-2"
                      onClick={() => setAmountReceived(amount.toString())}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Change */}
                {parseFloat(amountReceived) >= total && (
                  <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                    <span className="font-medium">Cambio</span>
                    <span className="text-2xl font-bold text-primary">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2"
                onClick={handleClose}
                disabled={isProcessing}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl"
                onClick={handleConfirm}
                disabled={!canProceed || isProcessing}
              >
                {isProcessing ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar pago
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
