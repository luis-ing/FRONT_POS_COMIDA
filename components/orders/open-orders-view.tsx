"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  Search, Clock, ChefHat, Plus, Banknote, MoreHorizontal, Edit2,
  Eye, RefreshCw, Loader2, Wifi, WifiOff, XCircle, Trash2, AlertCircle,
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
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { getVentas, cerrarOrden, getVenta, cancelarVenta, cancelarProducto } from "@/services/venta_service"
import { getEstatusOrden, getMetodosPago, getEstatusPago } from "@/services/catalogo_service"
import {
  getSocket, onNuevaOrden, offNuevaOrden,
  onOrdenActualizada, offOrdenActualizada, onOrdenLista, offOrdenLista,
  onOrdenCancelada, offOrdenCancelada,
} from "@/services/socket_client"
import {
  estaDetalleCancelado,
  dentroDelLimiteCancelacion,
  mensajeLimiteCancelacion,
  esVentaDeHoy,
} from "@/lib/venta-utils"
import type {
  VentaResponse, EstatusOrdenResponse, MetodoPagoResponse,
  EstatusPagoResponse, DetalleVentaResponse,
} from "@/types/schemas"
import { PaymentModal } from "../catalog/payment-modal"
import { CancelModal } from "../catalog/cancel-modal"

const STATUS_UI: Record<string, { label: string; color: string; bgCard: string }> = {
  pendiente:      { label: "Pendiente",      color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", bgCard: "border-yellow-500/20" },
  en_preparacion: { label: "En preparación", color: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400", bgCard: "border-orange-500/20" },
  lista:          { label: "Lista",          color: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",     bgCard: "border-green-500/20" },
}

const ESTATUS_FALLBACK: Record<number, string> = { 1: "pendiente", 2: "en_preparacion", 3: "lista", 4: "entregada", 5: "cancelada" }

export function OpenOrdersView() {
  const router = useRouter()

  const [ventas,         setVentas]         = useState<VentaResponse[]>([])
  const [estatusOrdenes, setEstatusOrdenes] = useState<EstatusOrdenResponse[]>([])
  const [estatusPagos,   setEstatusPagos]   = useState<EstatusPagoResponse[]>([])
  const [loading,        setLoading]        = useState(true)
  const [connected,      setConnected]      = useState(false)

  const estatusOrdenesRef = useRef<EstatusOrdenResponse[]>([])
  useEffect(() => { estatusOrdenesRef.current = estatusOrdenes }, [estatusOrdenes])

  const [searchQuery,   setSearchQuery]   = useState("")
  const [selectedVenta, setSelectedVenta] = useState<VentaResponse | null>(null)
  const [isDetailOpen,  setIsDetailOpen]  = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [ventaACobrar,  setVentaACobrar]  = useState<VentaResponse | null>(null)
  const [closingId,     setClosingId]     = useState<number | null>(null)

  const [isCancelTotalOpen, setIsCancelTotalOpen] = useState(false)
  const [ventaACancelar,    setVentaACancelar]    = useState<VentaResponse | null>(null)
  const [cancellingTotal,   setCancellingTotal]   = useState(false)

  const [isCancelParcialOpen, setIsCancelParcialOpen] = useState(false)
  const [detalleACancelar,    setDetalleACancelar]    = useState<DetalleVentaResponse | null>(null)
  const [ventaDeDetalle,      setVentaDeDetalle]      = useState<VentaResponse | null>(null)
  const [cancellingParcial,   setCancellingParcial]   = useState(false)

  useEffect(() => {
    Promise.all([getEstatusOrden(), getMetodosPago(), getEstatusPago()])
      .then(([eo, _mp, ep]) => { setEstatusOrdenes(eo); setEstatusPagos(ep) })
      .catch(() => toast.error("Error al cargar catálogos"))
  }, [])

  const getNombreEstatus = useCallback((id: number): string => {
    return estatusOrdenes.find(e => e.id === id)?.nombre
      ?? estatusOrdenesRef.current.find(e => e.id === id)?.nombre
      ?? ESTATUS_FALLBACK[id] ?? "pendiente"
  }, [estatusOrdenes])

  const getNombrePago = useCallback((id: number) =>
    estatusPagos.find(e => e.id === id)?.nombre ?? String(id)
  , [estatusPagos])

  const getStatusUI = useCallback((id: number) =>
    STATUS_UI[getNombreEstatus(id)] ?? STATUS_UI["pendiente"]
  , [getNombreEstatus])

  // Excluye canceladas
  const ventasActivas = useMemo(() =>
    ventas.filter(v => getNombreEstatus(v.idEstatusOrden) !== "cancelada")
  , [ventas, getNombreEstatus])

  const stats = useMemo(() => ({
    total:          ventasActivas.length,
    pendientes:     ventasActivas.filter(v => getNombreEstatus(v.idEstatusOrden) === "pendiente").length,
    enPreparacion:  ventasActivas.filter(v => getNombreEstatus(v.idEstatusOrden) === "en_preparacion").length,
    listas:         ventasActivas.filter(v => getNombreEstatus(v.idEstatusOrden) === "lista").length,
    totalPendiente: ventasActivas.reduce((sum, v) => sum + Number(v.total), 0),
  }), [ventasActivas, getNombreEstatus])

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVentas({ idEstatusPago: 1 })
      setVentas(data)
    } catch {
      toast.error("Error al cargar órdenes abiertas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  const handleNueva = useCallback(async (venta: VentaResponse) => {
    try {
      const v = await getVenta(venta.id)
      setVentas(prev => prev.some(x => x.id === v.id) ? prev : [v, ...prev])
    } catch {
      setVentas(prev => prev.some(x => x.id === venta.id) ? prev : [venta, ...prev])
    }
  }, [])

  const handleActualizada = useCallback(async (venta: VentaResponse) => {
    try {
      const v = await getVenta(venta.id)
      setVentas(prev => prev.map(x => x.id === v.id ? v : x))
      setSelectedVenta(prev => prev?.id === v.id ? v : prev)
    } catch {
      setVentas(prev => prev.map(x => x.id === venta.id ? venta : x))
    }
  }, [])

  const handleLista = useCallback(async ({ venta_id }: { venta_id: number }) => {
    try {
      const v = await getVenta(venta_id)
      setVentas(prev => prev.map(x => x.id === venta_id ? v : x))
      toast.success(`¡Orden #${v.numeroOrden} está lista para cobrar!`)
    } catch {
      toast.success(`¡Orden #${venta_id} está lista!`)
    }
  }, [])

  const handleCancelada = useCallback(({ venta_id }: { venta_id: number }) => {
    setVentas(prev => prev.filter(v => v.id !== venta_id))
    setSelectedVenta(prev => {
      if (prev?.id === venta_id) { setIsDetailOpen(false); return null }
      return prev
    })
  }, [])

  useEffect(() => {
    const socket = getSocket()
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    if (socket.connected) setConnected(true)
    onNuevaOrden(handleNueva)
    onOrdenActualizada(handleActualizada)
    onOrdenLista(handleLista)
    onOrdenCancelada(handleCancelada)
    return () => {
      offNuevaOrden(handleNueva); offOrdenActualizada(handleActualizada)
      offOrdenLista(handleLista); offOrdenCancelada(handleCancelada)
      socket.off("connect"); socket.off("disconnect")
    }
  }, [handleNueva, handleActualizada, handleLista, handleCancelada])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  const getElapsed = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const filtered = ventasActivas.filter(v =>
    String(v.numeroOrden).includes(searchQuery) ||
    (v.aliasCliente ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.notas ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCobrar = (v: VentaResponse) => { setVentaACobrar(v); setIsPaymentOpen(true) }

  const handleConfirmPayment = async (idMetodoPago: number) => {
    if (!ventaACobrar) return
    setClosingId(ventaACobrar.id)
    try {
      const closed = await cerrarOrden(ventaACobrar.id, { idMetodoPago })
      setVentas(prev => prev.filter(v => v.id !== closed.id))
      toast.success(`Orden #${closed.numeroOrden} cobrada`)
      setIsPaymentOpen(false); setIsDetailOpen(false); setVentaACobrar(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cerrar la orden")
    } finally {
      setClosingId(null)
    }
  }

  const openCancelTotal = (v: VentaResponse) => { setVentaACancelar(v); setIsCancelTotalOpen(true) }

  const handleCancelarTotal = async (motivo: string) => {
    if (!ventaACancelar) return
    setCancellingTotal(true)
    try {
      await cancelarVenta(ventaACancelar.id, { motivo: motivo.trim() || undefined })
      setVentas(prev => prev.filter(v => v.id !== ventaACancelar.id))
      if (selectedVenta?.id === ventaACancelar.id) { setIsDetailOpen(false); setSelectedVenta(null) }
      setIsCancelTotalOpen(false); setVentaACancelar(null)
      toast.success(`Orden #${ventaACancelar.numeroOrden} cancelada`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cancelar")
    } finally {
      setCancellingTotal(false)
    }
  }

  const openCancelParcial = (v: VentaResponse, d: DetalleVentaResponse) => {
    setVentaDeDetalle(v); setDetalleACancelar(d); setIsCancelParcialOpen(true)
  }

  const handleCancelarParcial = async (motivo: string) => {
    if (!ventaDeDetalle || !detalleACancelar) return
    setCancellingParcial(true)
    try {
      const updated = await cancelarProducto(ventaDeDetalle.id, {
        idDetalleVenta: detalleACancelar.id,
        motivo: motivo.trim(),
      })
      setVentas(prev => prev.map(v => v.id === updated.id ? updated : v))
      setSelectedVenta(prev => prev?.id === updated.id ? updated : prev)
      setIsCancelParcialOpen(false); setDetalleACancelar(null); setVentaDeDetalle(null)
      toast.success("Producto cancelado")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cancelar producto")
    } finally {
      setCancellingParcial(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Órdenes Abiertas</h1>
            <p className="text-muted-foreground">Gestiona las órdenes pendientes de cobro</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium",
              connected ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive")}>
              {connected ? <><Wifi className="h-4 w-4" /> En línea</> : <><WifiOff className="h-4 w-4" /> Desconectado</>}
            </div>
            <Button variant="outline" className="rounded-xl border-2 gap-2" onClick={fetchVentas} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Actualizar
            </Button>
            <Button className="rounded-xl gap-2" onClick={() => router.push("/")}>
              <Plus className="h-4 w-4" /> Nueva orden
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          {[
            { label: "Total abiertas",     value: stats.total,         cls: "border-border",                              txt: "text-foreground" },
            { label: "Pendientes",         value: stats.pendientes,    cls: "border-yellow-500/20 bg-yellow-500/5",       txt: "text-yellow-600 dark:text-yellow-400" },
            { label: "En preparación",     value: stats.enPreparacion, cls: "border-orange-500/20 bg-orange-500/5",       txt: "text-orange-600 dark:text-orange-400" },
            { label: "Listas para cobrar", value: stats.listas,        cls: "border-green-500/20 bg-green-500/5",         txt: "text-green-600 dark:text-green-400" },
            { label: "Total pendiente",    value: `$${stats.totalPendiente.toFixed(2)}`, cls: "border-primary/20 bg-primary/5", txt: "text-primary" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-2xl border-2 bg-card p-4", s.cls)}>
              <p className={cn("text-sm", s.txt)}>{s.label}</p>
              <p className={cn("text-2xl font-bold", s.txt)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por orden, cliente o notas..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="h-11 rounded-xl border-2 pl-12" />
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
                const ui      = getStatusUI(venta.idEstatusOrden)
                const esLista = getNombreEstatus(venta.idEstatusOrden) === "lista"
                return (
                  <div key={venta.id} className={cn("group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg", ui.bgCard)}>
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">#{venta.numeroOrden}</h3>
                        {venta.aliasCliente && <p className="text-sm font-medium text-primary">{venta.aliasCliente}</p>}
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
                          <DropdownMenuItem onClick={() => { setSelectedVenta(venta); setIsDetailOpen(true) }}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/?ordenId=${venta.id}`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Agregar productos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openCancelTotal(venta)}
                            disabled={!esVentaDeHoy(venta)}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar orden
                          </DropdownMenuItem>
                          {!esVentaDeHoy(venta) && (
                            <p className="px-2 py-1 text-xs text-muted-foreground">
                              Solo ventas del día actual
                            </p>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-lg border-2", ui.color)}>{ui.label}</Badge>
                    </div>

                    <div className="mb-4 flex-1 space-y-1">
                      {venta.detalleventa.slice(0, 3).map(d => {
                        const cancelado = estaDetalleCancelado(d)
                        return (
                          <div key={d.id} className={cn("flex items-center justify-between text-sm", cancelado && "opacity-40")}>
                            <span className={cn("flex items-center gap-1 text-muted-foreground", cancelado && "line-through")}>
                              <span className="font-medium text-foreground">{d.cantidad}x</span>
                              {d.producto?.nombre ?? `Producto #${d.idProducto}`}
                              {d.producto?.requiereCoccion && <ChefHat className="h-3 w-3 text-orange-500" />}
                            </span>
                            <span className={cancelado ? "line-through" : ""}>${Number(d.subtotal).toFixed(2)}</span>
                          </div>
                        )
                      })}
                      {venta.detalleventa.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{venta.detalleventa.length - 3} más</p>
                      )}
                    </div>

                    {venta.notas && (
                      <div className="mb-4 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground italic">{venta.notas}</div>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <span className="text-lg font-bold">${Number(venta.total).toFixed(2)}</span>
                      <Button size="sm" className="rounded-xl gap-1"
                        disabled={!esLista || closingId === venta.id} onClick={() => handleCobrar(venta)}>
                        {closingId === venta.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                        Cobrar
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                  <p className="font-medium">No hay órdenes abiertas</p>
                  <p className="text-sm">Las nuevas órdenes aparecerán aquí en tiempo real</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal detalle con cancelación parcial */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedVenta && (<>
                  Orden #{selectedVenta.numeroOrden}
                  <Badge variant="outline" className={cn("rounded-lg border-2", getStatusUI(selectedVenta.idEstatusOrden).color)}>
                    {getStatusUI(selectedVenta.idEstatusOrden).label}
                  </Badge>
                </>)}
              </DialogTitle>
            </DialogHeader>
            {selectedVenta && (() => {
              const dentroLimite = dentroDelLimiteCancelacion(selectedVenta)
              const esAbierta    = getNombrePago(selectedVenta.idEstatusPago) === "ABIERTA"
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Abierta: {formatTime(selectedVenta.fechaApertura)}</span>
                    <span className="text-muted-foreground">Tiempo: {getElapsed(selectedVenta.fechaApertura)}</span>
                  </div>

                  {selectedVenta.aliasCliente && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm font-medium text-primary">
                      Cliente: {selectedVenta.aliasCliente}
                    </div>
                  )}

                  {esAbierta && !dentroLimite && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{mensajeLimiteCancelacion()}</span>
                    </div>
                  )}

                  <div className="rounded-xl border-2 border-border overflow-hidden">
                    <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                      <p className="font-medium">Productos ({selectedVenta.detalleventa.length})</p>
                      {esAbierta && (
                        <p className="text-xs text-muted-foreground">
                          {dentroLimite ? "× para cancelar un producto" : "Cancelación parcial no disponible (+2h)"}
                        </p>
                      )}
                    </div>
                    <ScrollArea className="h-52">
                      <div className="space-y-2 p-3">
                        {selectedVenta.detalleventa.map(d => {
                          const cancelado       = estaDetalleCancelado(d)
                          const puedeCancel     = esAbierta && !cancelado && dentroLimite
                          const btnDeshabilitado = esAbierta && !cancelado && !dentroLimite
                          return (
                            <div key={d.id} className={cn("flex items-center justify-between rounded-lg border border-border/50 px-3 py-2", cancelado && "opacity-40")}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{d.cantidad}x</span>
                                <span className={cn(cancelado && "line-through")}>
                                  {d.producto?.nombre ?? `Producto #${d.idProducto}`}
                                </span>
                                {d.producto?.requiereCoccion && <ChefHat className="h-4 w-4 text-orange-500" />}
                                {cancelado && (
                                  <Badge variant="outline" className="rounded text-xs border-destructive/50 text-destructive">Cancelado</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${Number(d.subtotal).toFixed(2)}</span>
                                {puedeCancel && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                                    onClick={() => openCancelParcial(selectedVenta, d)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {btnDeshabilitado && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground" disabled>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{mensajeLimiteCancelacion()}</p></TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          )
                        })}
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
                    <span className="text-2xl font-bold text-primary">${Number(selectedVenta.total).toFixed(2)}</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl border-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={() => openCancelTotal(selectedVenta)}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancelar orden
                    </Button>
                    <Button className="flex-1 rounded-xl gap-2"
                      disabled={getNombreEstatus(selectedVenta.idEstatusOrden) !== "lista"}
                      onClick={() => handleCobrar(selectedVenta)}>
                      <Banknote className="h-4 w-4" /> Cobrar orden
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {ventaACobrar && (
          <PaymentModal open={isPaymentOpen} onOpenChange={setIsPaymentOpen}
            items={ventaACobrar.detalleventa.map(d => ({
              id: d.idProducto, name: d.producto?.nombre ?? `Producto #${d.idProducto}`,
              price: Number(d.precioUnitario), quantity: d.cantidad,
              enviadoACocina: d.enviadoACocina, requiereCoccion: d.producto?.requiereCoccion ?? false,
            }))}
            total={Number(ventaACobrar.total)} onConfirmPayment={handleConfirmPayment} isClosingOrder={true} />
        )}

        {ventaACancelar && (
          <CancelModal open={isCancelTotalOpen} onOpenChange={setIsCancelTotalOpen}
            title={`Cancelar orden #${ventaACancelar.numeroOrden}`}
            description="Se cancelará la orden completa. El motivo es obligatorio."
            motivoRequerido={true} onConfirm={handleCancelarTotal} loading={cancellingTotal} />
        )}

        {detalleACancelar && ventaDeDetalle && (
          <CancelModal open={isCancelParcialOpen} onOpenChange={setIsCancelParcialOpen}
            title={`Cancelar: ${detalleACancelar.producto?.nombre ?? `Producto #${detalleACancelar.idProducto}`}`}
            description={`Se cancelará la línea completa (${detalleACancelar.cantidad}x) de la orden #${ventaDeDetalle.numeroOrden}. El motivo es obligatorio.`}
            motivoRequerido={true} onConfirm={handleCancelarParcial} loading={cancellingParcial} />
        )}
      </div>
    </TooltipProvider>
  )
}