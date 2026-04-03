"use client"

import {
  Minus, Plus, Printer, Save, Trash2, ArrowRight,
  ChefHat, FileText, RotateCcw, Clock, Check, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { CartItem, SaleFlow, OpenOrderSummary } from "./catalog-view"

// ─── Props ────────────────────────────────────────────────────────────────────

interface CartPanelProps {
  items:            CartItem[]
  onUpdateQuantity: (id: number, quantity: number, enviadoACocina: boolean) => void
  onClearCart:      () => void
  saleFlow:         SaleFlow
  currentOrderId:   number | null          // ahora es number (id real de BD)
  onPayment:        () => void
  onOpenOrder:      () => void
  onAddToOpenOrder: () => void
  onSendToKitchen:  () => void
  onNewSale:        () => void
  openOrders:       OpenOrderSummary[]     // tipo actualizado
  onLoadOrder:      (ventaId: number) => void
  submitting?:      boolean                // bloquea botones mientras hay llamadas en curso
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CartPanel({
  items,
  onUpdateQuantity,
  onClearCart,
  saleFlow,
  currentOrderId,
  onPayment,
  onOpenOrder,
  onAddToOpenOrder,
  onNewSale,
  openOrders,
  onLoadOrder,
  submitting = false,
}: CartPanelProps) {
  const subtotal     = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const pendingItems = items.filter(i => !i.enviadoACocina)
  const sentItems    = items.filter(i => i.enviadoACocina)
  const hasPending   = pendingItems.length > 0
  const hasSent      = sentItems.length > 0

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  return (
    <aside className="flex w-96 flex-col border-l-2 border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {currentOrderId ? (
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Orden #{currentOrderId}
              </span>
            ) : (
              "Nueva venta"
            )}
          </h2>
          {currentOrderId && (
            <Badge variant="outline" className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary">
              Abierta
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-2">
            <Printer className="h-4 w-4" />
          </Button>

          {/* Dropdown de órdenes abiertas */}
          {openOrders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-lg border-2">
                  <FileText className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {openOrders.length}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Órdenes abiertas
                </div>
                {openOrders.map(order => (
                  <DropdownMenuItem
                    key={order.id}
                    onClick={() => onLoadOrder(order.id)}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{order.label}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-2"
            onClick={onNewSale}
            disabled={submitting}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
            <p>No hay productos</p>
            <p className="text-sm">Agrega productos al carrito</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enviados a cocina */}
            {hasSent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" /> Enviado a cocina
                </div>
                {sentItems.map((item, idx) => (
                  <div
                    key={`sent-${item.id}-${idx}`}
                    className="flex items-start justify-between rounded-xl border-2 border-border/50 bg-muted/30 p-3 opacity-70"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.requiereCoccion && <ChefHat className="h-4 w-4 text-orange-500" />}
                      </div>
                      <span className="mt-1 block text-sm text-muted-foreground">x{item.quantity}</span>
                    </div>
                    <p className="font-semibold text-muted-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Pendientes */}
            {hasPending && (
              <div className="space-y-3">
                {hasSent && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4 text-yellow-500" /> Pendiente de enviar
                  </div>
                )}
                {pendingItems.map((item, idx) => (
                  <div
                    key={`pending-${item.id}-${idx}`}
                    className={cn(
                      "flex items-start justify-between rounded-xl border-2 p-3",
                      item.requiereCoccion ? "border-orange-500/30 bg-orange-500/5" : "border-border"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.requiereCoccion && <ChefHat className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg border-2"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1, false)}
                          disabled={submitting}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg border-2"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1, false)}
                          disabled={submitting}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t-2 border-border p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-xl font-bold text-foreground">${subtotal.toFixed(2)}</span>
        </div>

        {/* ── FLUJO 1: Cobro inmediato ─────────────────────────────────────── */}
        {saleFlow === "flujo1" && (
          <>
            <Button
              variant="outline"
              className="mb-3 w-full rounded-xl border-2"
              onClick={onClearCart}
              disabled={items.length === 0 || submitting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar carrito
            </Button>
            <Button
              className="h-12 w-full rounded-xl text-base font-semibold"
              disabled={items.length === 0 || submitting}
              onClick={onPayment}
            >
              {submitting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : null}
              Cobrar ${subtotal.toFixed(2)}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </>
        )}

        {/* ── FLUJO 2: Orden abierta ───────────────────────────────────────── */}
        {saleFlow === "flujo2" && (
          <>
            {!currentOrderId ? (
              // Sin orden activa → abrir
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  onClick={onClearCart}
                  disabled={items.length === 0 || submitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Limpiar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  disabled={!hasPending || submitting}
                  onClick={onOpenOrder}
                >
                  {submitting
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Save className="mr-2 h-4 w-4" />}
                  Abrir orden
                </Button>
              </div>
            ) : (
              // Con orden activa → enviar más productos o cobrar
              <>
                {hasPending && (
                  <Button
                    variant="outline"
                    className="mb-3 w-full rounded-xl border-2 border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                    onClick={onAddToOpenOrder}
                    disabled={submitting}
                  >
                    {submitting
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <ChefHat className="mr-2 h-4 w-4" />}
                    Enviar a cocina
                  </Button>
                )}
                <Button
                  className="h-12 w-full rounded-xl text-base font-semibold"
                  disabled={hasPending || submitting}
                  onClick={onPayment}
                >
                  {submitting
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : null}
                  {hasPending
                    ? "Envía a cocina antes de cobrar"
                    : <>Cerrar y cobrar ${subtotal.toFixed(2)} <ArrowRight className="ml-2 h-5 w-5" /></>}
                </Button>
              </>
            )}

            {!currentOrderId && items.length > 0 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Abre una orden para enviar a cocina y agregar más productos
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  )
}