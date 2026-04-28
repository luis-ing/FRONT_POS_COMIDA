"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CancelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Si true, el motivo es obligatorio y bloquea confirmar si está vacío */
  motivoRequerido?: boolean
  onConfirm: (motivo: string) => Promise<void>
  loading?: boolean
  /** Si true, deshabilita la interacción (ej. venta no es del día) */
  disabled?: boolean
}

export function CancelModal({
  open,
  onOpenChange,
  title,
  description,
  motivoRequerido = false,
  onConfirm,
  loading = false,
  disabled = false,
}: CancelModalProps) {
  const [motivo, setMotivo] = useState("")

  // Limpiar motivo al abrir el modal
  useEffect(() => {
    if (open) setMotivo("")
  }, [open])

  const canConfirm = !motivoRequerido || motivo.trim().length > 0

  const handleConfirm = async () => {
    if (!canConfirm) return
    await onConfirm(motivo)
  }

  return (
    <Dialog open={open} onOpenChange={loading || disabled ? undefined : onOpenChange}>
      <DialogContent className="rounded-2xl border-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Motivo de cancelación
              {motivoRequerido && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Textarea
              placeholder={
                motivoRequerido
                  ? "Escribe el motivo de la cancelación (requerido)..."
                  : "Escribe el motivo de la cancelación (opcional)..."
              }
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={loading || disabled}
              rows={3}
              className="rounded-xl border-2 resize-none"
            />
            {motivoRequerido && motivo.trim().length === 0 && !disabled && (
              <p className="text-xs text-destructive">El motivo es obligatorio para cancelar un producto.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-2"
              onClick={() => onOpenChange(false)}
              disabled={loading || disabled}
            >
              No cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleConfirm}
              disabled={!canConfirm || loading || disabled}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar cancelación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}