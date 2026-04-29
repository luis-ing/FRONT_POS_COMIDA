"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Calendar, MoreHorizontal, Eye, Loader2, XCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { getVentas, getVenta, cancelarVenta, cancelarProducto } from "@/services/venta_service"
import { getEstatusOrden, getEstatusPago, getCanalesVenta } from "@/services/catalogo_service"
import { CancelModal } from "../catalog/cancel-modal"
import {
  estaDetalleCancelado,
  dentroDelLimiteCancelacion,
  esVentaDeHoy,
  dentroDelLimiteCancelacionTotal,
  mensajeLimiteCancelacionTotal,
  getCanceladoInfo,
} from "@/lib/venta-utils"
import type {
  VentaResponse, EstatusOrdenResponse, EstatusPagoResponse,
  CanalVentaResponse, DetalleVentaResponse,
} from "@/types/schemas"

// ── Estilos de badge por nombre de estatus ────────────────────────────────────
const BADGE_BY_ESTATUS: Record<string, "default" | "secondary" | "outline"> = {
  pendiente:      "outline",
  en_preparacion: "secondary",
  lista:          "default",
  entregada:      "outline",
}

// IDs de estatusPago para ventas del día (ABIERTA=1, CERRADA=2 — ajusta si difieren)
// Solo mostrar abiertas y cerradas del día, no canceladas
const ID_ESTATUS_PAGO_CANCELADA_NOMBRE = "CANCELADA"

export function OrdersView() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [ventas,         setVentas]         = useState<VentaResponse[]>([])
  const [estatusOrdenes, setEstatusOrdenes] = useState<EstatusOrdenResponse[]>([])
  const [estatusPagos,   setEstatusPagos]   = useState<EstatusPagoResponse[]>([])
  const [canales,        setCanales]         = useState<CanalVentaResponse[]>([])
  const [loading,        setLoading]         = useState(true)
  const [isDetailOpen,   setIsDetailOpen]   = useState(false)
  const [selectedVenta,  setSelectedVenta]  = useState<VentaResponse | null>(null)
  const [detailLoading,  setDetailLoading]  = useState(false)

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [soloHoy,      setSoloHoy]      = useState(true)

  // ── Cancelación total ─────────────────────────────────────────────────────
  const [isCancelTotalOpen,  setIsCancelTotalOpen]  = useState(false)
  const [ventaACancelar,     setVentaACancelar]      = useState<VentaResponse | null>(null)
  const [cancellingTotal,    setCancellingTotal]     = useState(false)

  // ── Cancelación parcial ───────────────────────────────────────────────────
  const [isCancelParcialOpen, setIsCancelParcialOpen] = useState(false)
  const [detalleACancelar,    setDetalleACancelar]    = useState<DetalleVentaResponse | null>(null)
  const [ventaDeDetalle,      setVentaDeDetalle]      = useState<VentaResponse | null>(null)
  const [cancellingParcial,   setCancellingParcial]   = useState(false)

  // ── Carga de catálogos ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getEstatusOrden(), getEstatusPago(), getCanalesVenta()])
      .then(([eo, ep, cv]) => {
        setEstatusOrdenes(eo)
        setEstatusPagos(ep)
        setCanales(cv)
      })
      .catch(() => toast.error("Error al cargar catálogos"))
  }, [])

  // ── Carga de ventas ───────────────────────────────────────────────────────
  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      const hoy   = new Date()
      const desde = soloHoy
        ? new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
        : undefined
      const data = await getVentas({ desde })
      setVentas(data)
    } catch {
      toast.error("Error al cargar ventas")
    } finally {
      setLoading(false)
    }
  }, [soloHoy])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getNombreEstatus = (id: number) =>
    estatusOrdenes.find(e => e.id === id)?.nombre ?? String(id)

  const getNombrePagoById = (id: number) =>
    estatusPagos.find(e => e.id === id)?.nombre ?? String(id)

  const getNombreCanal = (id: number) =>
    canales.find(c => c.id === id)?.canal ?? String(id)

  const getHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  const getFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })

  // Una venta es cancelable si no está ya CANCELADA (por pago o estatus)
  const esCancelable = (venta: VentaResponse) => {
    const pago = getNombrePagoById(venta.idEstatusPago)
    const orden = getNombreEstatus(venta.idEstatusOrden)
    return pago !== ID_ESTATUS_PAGO_CANCELADA_NOMBRE && orden !== "cancelada"
  }

  // Una venta admite cancelación parcial solo si está ABIERTA
  const admiteCancelParcial = (venta: VentaResponse) =>
    getNombrePagoById(venta.idEstatusPago) === "ABIERTA"

  const openVentaDetail = async (ventaId: number) => {
    setIsDetailOpen(true)
    setSelectedVenta(null)
    setDetailLoading(true)
    try {
      const venta = await getVenta(ventaId)
      setSelectedVenta(venta)
    } catch {
      toast.error("Error al cargar detalles de la orden")
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeVentaDetail = () => {
    setIsDetailOpen(false)
    setSelectedVenta(null)
  }

  // ── Filtrado local ────────────────────────────────────────────────────────
  const filtered = ventas.filter(v => {
    const matchSearch =
      String(v.numeroOrden).includes(searchQuery) ||
      (v.aliasCliente ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || v.idEstatusOrden === parseInt(statusFilter)
    return matchSearch && matchStatus
  })

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)

  // ── Cancelación total ─────────────────────────────────────────────────────
  const openCancelTotal = (venta: VentaResponse, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setVentaACancelar(venta)
    setIsCancelTotalOpen(true)
  }

  const handleCancelarTotal = async (motivo: string) => {
    if (!ventaACancelar) return
    setCancellingTotal(true)
    try {
      await cancelarVenta(ventaACancelar.id, { motivo: motivo.trim() || undefined })
      // Actualizamos la venta en la lista recargándola para reflejar el nuevo estatus
      const ventaActualizada = await getVenta(ventaACancelar.id)
      setVentas(prev => prev.map(v => v.id === ventaActualizada.id ? ventaActualizada : v))
      // Si el detalle está abierto, actualizarlo también
      if (selectedVenta?.id === ventaACancelar.id) {
        setSelectedVenta(ventaActualizada)
      }
      setIsCancelTotalOpen(false)
      setVentaACancelar(null)
      toast.success(`Orden #${ventaACancelar.numeroOrden} cancelada`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cancelar la orden")
    } finally {
      setCancellingTotal(false)
    }
  }

  // ── Cancelación parcial ───────────────────────────────────────────────────
  const openCancelParcial = (venta: VentaResponse, detalle: DetalleVentaResponse) => {
    setVentaDeDetalle(venta)
    setDetalleACancelar(detalle)
    setIsCancelParcialOpen(true)
  }

  const handleCancelarParcial = async (motivo: string) => {
    if (!ventaDeDetalle || !detalleACancelar) return
    setCancellingParcial(true)
    try {
      const ventaActualizada = await cancelarProducto(ventaDeDetalle.id, {
        idDetalleVenta: detalleACancelar.id,
        motivo: motivo.trim(),
      })
      setVentas(prev => prev.map(v => v.id === ventaActualizada.id ? ventaActualizada : v))
      setSelectedVenta(prev => prev?.id === ventaActualizada.id ? ventaActualizada : prev)
      setIsCancelParcialOpen(false)
      setDetalleACancelar(null)
      setVentaDeDetalle(null)
      toast.success("Producto cancelado de la orden")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cancelar el producto")
    } finally {
      setCancellingParcial(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Órdenes</h1>
        <p className="text-muted-foreground">Gestiona todas las órdenes del sistema</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por orden o cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-[200px] rounded-xl border-2">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos los estados</SelectItem>
            {estatusOrdenes.map(e => (
              <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={soloHoy ? "default" : "outline"}
          className="h-11 rounded-xl border-2 gap-2"
          onClick={() => setSoloHoy(v => !v)}
        >
          <Calendar className="h-4 w-4" />
          {soloHoy ? "Hoy" : "Todas"}
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total órdenes",  value: ventas.length,                                                                           color: "text-foreground" },
          { label: "Pendientes",     value: ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "pendiente").length,           color: "text-primary" },
          { label: "En preparación", value: ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "en_preparacion").length,      color: "text-foreground" },
          { label: "Ventas del día", value: `$${totalVentas.toFixed(2)}`,                                                            color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[57vh]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Orden</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Cliente</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Canal</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Items</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Total</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Estado</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Pago</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Hora</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(venta => {
                  const nombreEstatus  = getNombreEstatus(venta.idEstatusOrden)
                  const nombrePago     = getNombrePagoById(venta.idEstatusPago)
                  const esCancelada    = nombrePago === "CANCELADA"
                  return (
                    <TableRow
                      key={venta.id}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/50",
                        esCancelada && "opacity-50"
                      )}
                    >
                      <TableCell className="font-medium">#{venta.numeroOrden}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {venta.aliasCliente ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg border-2">
                          {getNombreCanal(venta.idCanalVenta)}
                        </Badge>
                      </TableCell>
                      <TableCell>{venta.detalleventa.length} items</TableCell>
                      <TableCell className="font-semibold">${Number(venta.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={BADGE_BY_ESTATUS[nombreEstatus] ?? "outline"}
                          className="rounded-lg capitalize"
                        >
                          {nombreEstatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-lg border",
                            esCancelada && "border-destructive/40 text-destructive bg-destructive/5"
                          )}
                        >
                          {nombrePago}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getHora(venta.fechaApertura)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openVentaDetail(venta.id)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalles
                            </DropdownMenuItem>
                            {esCancelable(venta) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => openCancelTotal(venta, e)}
                                  disabled={!dentroDelLimiteCancelacionTotal(venta)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Cancelar orden
                                </DropdownMenuItem>
                                {!dentroDelLimiteCancelacionTotal(venta) && (
                                  <p className="px-2 py-1 text-xs text-muted-foreground">
                                    {mensajeLimiteCancelacionTotal()}
                                  </p>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No se encontraron órdenes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Modal de detalle con cancelación parcial ────────────────────────── */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={open => { if (!open) closeVentaDetail(); setIsDetailOpen(open) }}
      >
        <DialogContent className="rounded-2xl border-2 sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              Detalle de orden
              {selectedVenta && (
                <span className="text-sm text-muted-foreground">
                  Orden #{selectedVenta.numeroOrden} · {getNombreEstatus(selectedVenta.idEstatusOrden).replace("_", " ")}
                  {getNombrePagoById(selectedVenta.idEstatusPago) === "CANCELADA" && (
                    <span className="ml-2 text-destructive font-semibold">· CANCELADA</span>
                  )}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedVenta ? (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border-2 border-border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{getFecha(selectedVenta.fechaApertura)}</p>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{getHora(selectedVenta.fechaApertura)}</p>
                </div>
                <div className="rounded-2xl border-2 border-border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Canal</p>
                  <p className="font-medium">{getNombreCanal(selectedVenta.idCanalVenta)}</p>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  <p className={cn(
                    "font-medium",
                    getNombrePagoById(selectedVenta.idEstatusPago) === "CANCELADA" && "text-destructive"
                  )}>
                    {getNombrePagoById(selectedVenta.idEstatusPago)}
                  </p>
                </div>
              </div>

              {selectedVenta.aliasCliente && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                  Cliente: {selectedVenta.aliasCliente}
                </div>
              )}

              {/* Productos con opción de cancelar parcialmente (solo si venta ABIERTA) */}
              <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <p className="font-medium">Productos ({selectedVenta.detalleventa.length})</p>
                  {admiteCancelParcial(selectedVenta) && (
                    <p className="text-xs text-muted-foreground">Haz clic en × para cancelar un producto</p>
                  )}
                </div>
                <div className="max-h-72 overflow-auto">
                  <div className="space-y-3 p-4">
                    {selectedVenta.detalleventa.map(item => {
                      const cancelado = estaDetalleCancelado(item)
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-2xl border-2 border-border p-3",
                            cancelado && "opacity-40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className={cn("font-medium", cancelado && "line-through")}>
                                {item.producto?.nombre ?? `Producto #${item.idProducto}`}
                              </p>
                              <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">${Number(item.subtotal).toFixed(2)}</p>
                              {/* Botón cancelar parcial — solo en ventas ABIERTAS y detalle no cancelado */}
                              {admiteCancelParcial(selectedVenta) && !cancelado && dentroDelLimiteCancelacion(selectedVenta) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => openCancelParcial(selectedVenta, item)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {admiteCancelParcial(selectedVenta) && !cancelado && !dentroDelLimiteCancelacion(selectedVenta) && (
                                <p className="text-xs text-muted-foreground">No disponible (+7d)</p>
                              )}
                              {cancelado && (() => {
                                const info = getCanceladoInfo(item);
                                return info ? (
                                  <div className="mt-1 text-xs text-destructive/80 leading-tight">
                                    <span className="font-medium">Cancelado</span>
                                    {info.usuarioNombre && (
                                      <span className="font-normal"> por {info.usuarioNombre}</span>
                                    )}
                                    {info.motivo && (
                                      <span className="italic"> - {info.motivo}</span>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 text-sm text-muted-foreground">
                            <span>{item.producto?.categoria?.nombre}</span>
                            {item.producto?.requiereCoccion && (
                              <span className="rounded-full border px-2 py-0.5">requiere cocción</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {selectedVenta.notas && (
                <div className="rounded-2xl border-2 border-border bg-muted/30 p-4">
                  <p className="mb-2 text-sm font-medium">Notas</p>
                  <p className="text-sm text-muted-foreground">{selectedVenta.notas}</p>
                </div>
              )}

              <div className="rounded-2xl border-2 border-border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${Number(selectedVenta.total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  onClick={closeVentaDetail}
                >
                  Cerrar
                </Button>
                {esCancelable(selectedVenta) && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => openCancelTotal(selectedVenta)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar orden
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay datos para mostrar.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal cancelar total */}
      {ventaACancelar && (
        <CancelModal
          open={isCancelTotalOpen}
          onOpenChange={setIsCancelTotalOpen}
          title={`Cancelar orden #${ventaACancelar.numeroOrden}`}
          description={
            getNombrePagoById(ventaACancelar.idEstatusPago) === "CERRADA"
              ? "Esta orden ya fue cobrada. Se registrará como reembolso. El motivo es obligatorio."
              : "Se cancelará la orden completa. El motivo es obligatorio."
          }
          motivoRequerido={true}
          onConfirm={handleCancelarTotal}
          loading={cancellingTotal}
        />
      )}

      {/* Modal cancelar producto */}
      {detalleACancelar && ventaDeDetalle && (
        <CancelModal
          open={isCancelParcialOpen}
          onOpenChange={setIsCancelParcialOpen}
          title={`Cancelar producto: ${detalleACancelar.producto?.nombre ?? `#${detalleACancelar.idProducto}`}`}
          description={`Se cancelará la línea completa (${detalleACancelar.cantidad}x) de la orden #${ventaDeDetalle.numeroOrden}. El motivo es obligatorio.`}
          motivoRequerido={true}
          onConfirm={handleCancelarParcial}
          loading={cancellingParcial}
        />
      )}
    </div>
  )
}