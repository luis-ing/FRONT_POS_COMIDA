"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Clock, ChefHat, Plus, Banknote, MoreHorizontal, Edit2,
  Eye, RefreshCw, Loader2, Wifi, WifiOff,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { getVentas, cerrarOrden } from "@/services/venta_service"
import { getEstatusOrden, getMetodosPago } from "@/services/catalogo_service"
import {
  getSocket, onNuevaOrden, offNuevaOrden,
  onOrdenActualizada, offOrdenActualizada, onOrdenLista, offOrdenLista,
} from "@/services/socket_client"
import type { VentaResponse, EstatusOrdenResponse, MetodoPagoResponse } from "@/types/schemas"
import { PaymentModal } from "../catalog/payment-modal"

// ── Helpers de estatus ────────────────────────────────────────────────────────

const STATUS_UI: Record<string, {
  label:  string
  color:  string
  bgCard: string
}> = {
  pendiente: {
    label:  "Pendiente",
    color:  "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    bgCard: "border-yellow-500/20",
  },
  en_preparacion: {
    label:  "En preparación",
    color:  "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    bgCard: "border-orange-500/20",
  },
  lista: {
    label:  "Lista",
    color:  "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    bgCard: "border-green-500/20",
  },
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OpenOrdersView() {
  const router = useRouter()

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [ventas,         setVentas]         = useState<VentaResponse[]>([])
  const [estatusOrdenes, setEstatusOrdenes] = useState<EstatusOrdenResponse[]>([])
  const [metodosPago,    setMetodosPago]    = useState<MetodoPagoResponse[]>([])
  const [loading,        setLoading]        = useState(true)
  const [connected,      setConnected]      = useState(false)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState("")
  const [selectedVenta,  setSelectedVenta]  = useState<VentaResponse | null>(null)
  const [isDetailOpen,   setIsDetailOpen]   = useState(false)
  const [isPaymentOpen,  setIsPaymentOpen]  = useState(false)
  const [ventaACobrar,   setVentaACobrar]   = useState<VentaResponse | null>(null)
  const [closingId,      setClosingId]      = useState<number | null>(null)

  // ── Carga de catálogos ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getEstatusOrden(), getMetodosPago()])
      .then(([eo, mp]) => { setEstatusOrdenes(eo); setMetodosPago(mp) })
      .catch(() => toast.error("Error al cargar catálogos"))
  }, [])

  // ── Carga de ventas abiertas (idEstatusPago = ABIERTA = 1) ────────────────
  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      // Filtramos por idEstatusPago=1 (ABIERTA). Ajusta el id si tu BD difiere.
      const data = await getVentas({ idEstatusPago: 1 })
      setVentas(data)
    } catch {
      toast.error("Error al cargar órdenes abiertas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  // ── WebSockets ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    socket.on("connect",    () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    if (socket.connected) setConnected(true)

    const handleNueva = (venta: VentaResponse) => {
      setVentas(prev => prev.some(v => v.id === venta.id) ? prev : [venta, ...prev])
    }
    const handleActualizada = (venta: VentaResponse) => {
      setVentas(prev => prev.map(v => v.id === venta.id ? venta : v))
    }
    // Cuando cocina marca lista, resaltar en la UI
    const handleLista = (venta: VentaResponse) => {
      setVentas(prev => prev.map(v => v.id === venta.id ? venta : v))
      toast.success(`¡Orden #${venta.id} está lista para cobrar!`)
    }

    onNuevaOrden(handleNueva)
    onOrdenActualizada(handleActualizada)
    onOrdenLista(handleLista)

    return () => {
      offNuevaOrden(handleNueva)
      offOrdenActualizada(handleActualizada)
      offOrdenLista(handleLista)
      socket.off("connect")
      socket.off("disconnect")
    }
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getNombreEstatus = (idEstatusOrden: number) =>
    estatusOrdenes.find(e => e.id === idEstatusOrden)?.nombre ?? "pendiente"

  const getStatusUI = (idEstatusOrden: number) =>
    STATUS_UI[getNombreEstatus(idEstatusOrden)] ?? STATUS_UI["pendiente"]

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  const getElapsed = (iso: string) => {
    const diff    = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} min`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = ventas.filter(v =>
    String(v.id).includes(searchQuery) ||
    (v.notas ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Cobrar orden ──────────────────────────────────────────────────────────
  const handleCobrar = (venta: VentaResponse) => {
    setVentaACobrar(venta)
    setIsPaymentOpen(true)
  }

  const handleConfirmPayment = async (idMetodoPago: number) => {
    if (!ventaACobrar) return
    setClosingId(ventaACobrar.id)
    try {
      const closed = await cerrarOrden(ventaACobrar.id, { idMetodoPago })
      // Quitamos la orden de la lista (ya está cerrada)
      setVentas(prev => prev.filter(v => v.id !== closed.id))
      toast.success(`Orden #${closed.id} cobrada exitosamente`)
      setIsPaymentOpen(false)
      setIsDetailOpen(false)
      setVentaACobrar(null)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al cerrar la orden"
      toast.error(msg)
    } finally {
      setClosingId(null)
    }
  }

  // ── Ver detalle ───────────────────────────────────────────────────────────
  const handleViewDetail = (venta: VentaResponse) => {
    setSelectedVenta(venta)
    setIsDetailOpen(true)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:          ventas.length,
    pendientes:     ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "pendiente").length,
    enPreparacion:  ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "en_preparacion").length,
    listas:         ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "lista").length,
    totalPendiente: ventas.reduce((sum, v) => sum + Number(v.total), 0),
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes Abiertas</h1>
          <p className="text-muted-foreground">Gestiona las órdenes pendientes de cobro</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador WebSocket */}
          <div className={cn(
            "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium",
            connected
              ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}>
            {connected ? <><Wifi className="h-4 w-4" /> En línea</> : <><WifiOff className="h-4 w-4" /> Desconectado</>}
          </div>
          <Button variant="outline" className="rounded-xl border-2 gap-2" onClick={fetchVentas} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button className="rounded-xl gap-2" onClick={() => router.push("/")}>
            <Plus className="h-4 w-4" /> Nueva orden
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total abiertas</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-2xl border-2 border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendientes}</p>
        </div>
        <div className="rounded-2xl border-2 border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400">En preparación</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.enPreparacion}</p>
        </div>
        <div className="rounded-2xl border-2 border-green-500/20 bg-green-500/5 p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Listas para cobrar</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.listas}</p>
        </div>
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary">Total pendiente</p>
          <p className="text-2xl font-bold text-primary">${stats.totalPendiente.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID u notas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(venta => {
              const ui = getStatusUI(venta.idEstatusOrden)
              const esLista = getNombreEstatus(venta.idEstatusOrden) === "lista"
              return (
                <div
                  key={venta.id}
                  className={cn(
                    "group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg",
                    ui.bgCard
                  )}
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">#{venta.id}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(venta.fechaApertura)} ({getElapsed(venta.fechaApertura)})
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleViewDetail(venta)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/?ordenId=${venta.id}`)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Agregar productos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled
                        >
                          Cancelar orden
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badge + notas */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-lg border-2", ui.color)}>
                      {ui.label}
                    </Badge>
                    {venta.idCliente && (
                      <span className="text-sm text-muted-foreground">Cliente #{venta.idCliente}</span>
                    )}
                  </div>

                  {/* Items preview */}
                  <div className="mb-4 flex-1 space-y-1">
                    {venta.detalleventa.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{d.cantidad}x</span>
                          {d.producto?.nombre ?? `Producto #${d.idProducto}`}
                          {d.producto?.requiereCoccion && (
                            <ChefHat className="h-3 w-3 text-orange-500" />
                          )}
                        </span>
                        <span>${Number(d.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                    {venta.detalleventa.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{venta.detalleventa.length - 3} productos más
                      </p>
                    )}
                  </div>

                  {venta.notas && (
                    <div className="mb-4 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground italic">
                      {venta.notas}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-lg font-bold text-foreground">
                      ${Number(venta.total).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-xl gap-1"
                      disabled={!esLista || closingId === venta.id}
                      onClick={() => handleCobrar(venta)}
                    >
                      {closingId === venta.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Banknote className="h-4 w-4" />}
                      Cobrar
                    </Button>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                <p className="font-medium">No hay órdenes abiertas</p>
                <p className="text-sm">Las nuevas órdenes aparecerán aquí en tiempo real</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalle Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedVenta && (
                <>
                  Orden #{selectedVenta.id}
                  <Badge
                    variant="outline"
                    className={cn("rounded-lg border-2", getStatusUI(selectedVenta.idEstatusOrden).color)}
                  >
                    {getStatusUI(selectedVenta.idEstatusOrden).label}
                  </Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedVenta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Abierta: {formatTime(selectedVenta.fechaApertura)}
                </span>
                <span className="text-muted-foreground">
                  Tiempo: {getElapsed(selectedVenta.fechaApertura)}
                </span>
              </div>

              {/* Productos */}
              <div className="rounded-xl border-2 border-border">
                <div className="border-b border-border px-4 py-2">
                  <p className="font-medium">Productos ({selectedVenta.detalleventa.length})</p>
                </div>
                <ScrollArea className="max-h-60">
                  <div className="space-y-3 p-4">
                    {selectedVenta.detalleventa.map(d => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{d.cantidad}x</span>
                          <span>{d.producto?.nombre ?? `Producto #${d.idProducto}`}</span>
                          {d.producto?.requiereCoccion && (
                            <ChefHat className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <span className="font-medium">${Number(d.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {selectedVenta.notas && (
                <div className="rounded-xl border-2 border-border bg-muted/30 p-4">
                  <p className="mb-1 text-sm font-medium">Notas</p>
                  <p className="text-sm text-muted-foreground">{selectedVenta.notas}</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ${Number(selectedVenta.total).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={() => setIsDetailOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  className="flex-1 rounded-xl gap-2"
                  disabled={getNombreEstatus(selectedVenta.idEstatusOrden) !== "lista"}
                  onClick={() => handleCobrar(selectedVenta)}
                >
                  <Banknote className="h-4 w-4" /> Cobrar orden
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {ventaACobrar && (
        <PaymentModal
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          items={ventaACobrar.detalleventa.map(d => ({
            id:       d.idProducto,
            name:     d.producto?.nombre ?? `Producto #${d.idProducto}`,
            price:    Number(d.precioUnitario),
            quantity: d.cantidad,
            enviadoACocina:  d.enviadoACocina,
            requiereCoccion: d.producto?.requiereCoccion ?? false,
          }))}
          total={Number(ventaACobrar.total)}
          onConfirmPayment={handleConfirmPayment}
          isClosingOrder={true}
        />
      )}
    </div>
  )
}