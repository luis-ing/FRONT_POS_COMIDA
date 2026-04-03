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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { getVentas } from "@/services/venta_service"
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
      <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border hover:bg-transparent">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Canal</TableHead>
                <TableHead className="font-semibold">Productos</TableHead>
                <TableHead className="font-semibold">Total</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Hora</TableHead>
                <TableHead className="w-[50px]" />
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
                          <DropdownMenuItem>
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
        )}
      </div>
    </div>
  )
}