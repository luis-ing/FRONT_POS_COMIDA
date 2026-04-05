"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Calendar, MoreHorizontal, Eye, Loader2 } from "lucide-react"
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { getVentas, getVenta } from "@/services/venta_service"
import { getEstatusOrden, getEstatusPago, getCanalesVenta } from "@/services/catalogo_service"
import type { VentaResponse, EstatusOrdenResponse, EstatusPagoResponse, CanalVentaResponse } from "@/types/schemas"

// ── Estilos de badge por nombre de estatus ────────────────────────────────────
const BADGE_BY_ESTATUS: Record<string, "default" | "secondary" | "outline"> = {
  pendiente:      "outline",
  en_preparacion: "secondary",
  lista:          "default",
  entregada:      "outline",
}

export function OrdersView() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [ventas,          setVentas]          = useState<VentaResponse[]>([])
  const [estatusOrdenes,  setEstatusOrdenes]  = useState<EstatusOrdenResponse[]>([])
  const [estatusPagos,    setEstatusPagos]    = useState<EstatusPagoResponse[]>([])
  const [canales,         setCanales]         = useState<CanalVentaResponse[]>([])
  const [loading,         setLoading]         = useState(true)
  const [isDetailOpen,    setIsDetailOpen]    = useState(false)
  const [selectedVenta,   setSelectedVenta]   = useState<VentaResponse | null>(null)
  const [detailLoading,   setDetailLoading]   = useState(false)

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState("")
  const [statusFilter,   setStatusFilter]   = useState("all")  // idEstatusOrden
  const [soloHoy,        setSoloHoy]        = useState(true)

  // ── Carga de catálogos (una sola vez) ─────────────────────────────────────
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

  const getNombreCanal = (id: number) =>
    canales.find(c => c.id === id)?.canal ?? String(id)

  const getHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  const getFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  const getNombrePago = (id: number) =>
    estatusPagos.find(e => e.id === id)?.nombre ?? String(id)

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
    const matchSearch = String(v.id).includes(searchQuery)
    const matchStatus = statusFilter === "all" || v.idEstatusOrden === parseInt(statusFilter)
    return matchSearch && matchStatus
  })

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)

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
            placeholder="Buscar por ID..."
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
          { label: "Total órdenes",   value: ventas.length,                                                color: "text-foreground" },
          { label: "Pendientes",      value: ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "pendiente").length,      color: "text-primary" },
          { label: "En preparación",  value: ventas.filter(v => getNombreEstatus(v.idEstatusOrden) === "en_preparacion").length, color: "text-foreground" },
          { label: "Ventas del día",  value: `$${totalVentas.toFixed(2)}`,                                 color: "text-foreground" },
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
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">ID</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Canal</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Productos</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Total</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Estado</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 font-semibold">Hora</TableHead>
                  <TableHead className="sticky top-0 bg-card z-20 w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
              {filtered.map(venta => {
                const nombreEstatus = getNombreEstatus(venta.idEstatusOrden)
                return (
                  <TableRow key={venta.id} className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="font-medium">#{venta.id}</TableCell>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No se encontraron órdenes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={open => { if (!open) closeVentaDetail(); setIsDetailOpen(open) }}>
        <DialogContent className="rounded-2xl border-2 sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              Detalle de orden
              {selectedVenta && (
                <span className="text-sm text-muted-foreground">
                  Orden #{selectedVenta.id} · {getNombreEstatus(selectedVenta.idEstatusOrden).replace("_", " ")}
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
                  <p className="font-medium">{getNombrePago(selectedVenta.idEstatusPago)}</p>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
                <div className="border-b border-border px-4 py-3">
                  <p className="font-medium">Productos ({selectedVenta.detalleventa.length})</p>
                </div>
                <div className="max-h-72 overflow-auto">
                  <div className="space-y-3 p-4">
                    {selectedVenta.detalleventa.map(item => (
                      <div key={item.id} className="rounded-2xl border-2 border-border p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{item.producto?.nombre ?? `Producto #${item.idProducto}`}</p>
                            <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                          </div>
                          <p className="font-semibold">${Number(item.subtotal).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 text-sm text-muted-foreground">
                          <span>{item.producto?.categoria?.nombre}</span>
                          {item.producto?.requiereCoccion && (
                            <span className="rounded-full border px-2 py-0.5">requiere cocción</span>
                          )}
                        </div>
                      </div>
                    ))}
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
                  <span className="text-2xl font-bold text-foreground">${Number(selectedVenta.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={closeVentaDetail}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay datos para mostrar.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}