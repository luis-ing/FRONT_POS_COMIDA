"use client"

import {
  Minus, Plus, Trash2, ArrowRight,
  ChefHat, FileText, RotateCcw, Clock, Check, Loader2, User, MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { estaDetalleCancelado, getCanceladoInfo } from "@/lib/venta-utils"
import type { CartItem, SaleFlow, OpenOrderSummary } from "./catalog-view"

// ─── Props ────────────────────────────────────────────────────────────────────

interface CartPanelProps {
  items: CartItem[]
  onUpdateQuantity: (id: number, quantity: number, enviadoACocina: boolean) => void
  onClearCart: () => void
  saleFlow: SaleFlow
  currentOrderId: number | null
  onPayment: () => void
  onOpenOrder: () => void
  onAddToOpenOrder: () => void
  onSendToKitchen: () => void
  onNewSale: () => void
  openOrders: OpenOrderSummary[]
  onLoadOrder: (ventaId: number) => void
  submitting?: boolean
  // ── Alias y notas ─────────────────────────────────────────────────────────
  aliasCliente: string
  notas: string
  onAliasChange: (value: string) => void
  onNotasChange: (value: string) => void
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
  aliasCliente,
  notas,
  onAliasChange,
  onNotasChange,
}: CartPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const pendingItems = items.filter(i => !i.enviadoACocina)
  const sentItems = items.filter(i => i.enviadoACocina)
  const hasPending = pendingItems.length > 0
  const hasSent = sentItems.length > 0

  // Los campos de alias/notas son editables cuando:
  // 1. No hay orden activa aún (flujo 1 o flujo 2 sin orden abierta), o
  // 2. Hay orden activa Y hay items pendientes de enviar a cocina (se aprovecha esa acción para actualizar)
  const metadataEditable = !currentOrderId || (!!currentOrderId && hasPending)

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [items.length])

  return (
    <aside className="flex w-96 flex-col h-full min-h-0 border-l-2 border-border bg-card">
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

      {/* Alias y notas — siempre visibles, editables según estado */}
      <div className="border-b-2 border-border px-4 py-3 space-y-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Cliente / Mesa
          </Label>
          <Input
            placeholder="Ej: Mesa 4, Juan, WhatsApp..."
            value={aliasCliente}
            onChange={e => onAliasChange(e.target.value)}
            disabled={!metadataEditable || submitting}
            className={cn(
              "h-8 rounded-lg border-2 text-sm",
              !metadataEditable && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Notas
          </Label>
          <Textarea
            placeholder="Instrucciones especiales, alergias..."
            value={notas}
            onChange={e => onNotasChange(e.target.value)}
            disabled={!metadataEditable || submitting}
            rows={2}
            className={cn(
              "rounded-lg border-2 text-sm resize-none",
              !metadataEditable && "opacity-50 cursor-not-allowed"
            )}
          />
          {currentOrderId && hasPending && (
            <p className="text-xs text-primary">
              ✏️ Los cambios se guardarán al enviar a cocina
            </p>
          )}
          {currentOrderId && !hasPending && (
            <p className="text-xs text-muted-foreground">
              Agrega productos para poder editar estos campos
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 min-h-0 p-4">
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
                {sentItems.map((item, idx) => {
                  const cancelado = estaDetalleCancelado(item);
                  const info = getCanceladoInfo(item);
                  return (
                  <div
                    key={`sent-${item.id}-${idx}`}
                    className={cn(
                      "flex items-start justify-between rounded-xl border-2 p-3",
                      cancelado
                        ? "opacity-60 border-destructive/30 bg-destructive/5"
                        : "opacity-70"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", cancelado && "line-through text-destructive/70")}>
                          {item.name}
                        </p>
                        {item.requiereCoccion && <ChefHat className="h-4 w-4 text-orange-500" />}
                      </div>
                      <span className={cn("mt-1 block text-sm text-muted-foreground", cancelado && "line-through text-destructive/70")}>
                        x{item.quantity}
                      </span>
                      {cancelado && info && (
                        <p className="text-xs text-destructive/80 mt-0.5 leading-tight">
                          <span className="font-medium">Cancelado</span>
                          {info.usuarioNombre && (
                            <span className="font-normal"> por {info.usuarioNombre}</span>
                          )}
                          {info.motivo && (
                            <span className="italic"> - {info.motivo}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <p className={cn("font-semibold", cancelado ? "line-through text-destructive/70" : "text-muted-foreground")}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                )})}
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

            <div ref={scrollRef} />
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
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cobrar ${subtotal.toFixed(2)}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </>
        )}

        {/* ── FLUJO 2: Orden abierta ───────────────────────────────────────── */}
        {saleFlow === "flujo2" && (
          <>
            {!currentOrderId ? (
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
                    : <FileText className="mr-2 h-4 w-4" />}
                  Abrir orden
                </Button>
              </div>
            ) : (
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
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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