"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Clock, ChefHat, MessageSquare, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { getVenta, getVentasActivasCocina } from "@/services/venta_service"
import { marcarEnPreparacion, marcarOrdenLista } from "@/services/cocina_service"
import {
  getSocket,
  onNuevaOrden,
  offNuevaOrden,
  onOrdenActualizada,
  offOrdenActualizada,
  onOrdenCancelada,
  offOrdenCancelada,
} from "@/services/socket_client"
import { estaDetalleCancelado, getCanceladoInfo } from "@/lib/venta-utils"
import type { VentaResponse } from "@/types/schemas"

export function KitchenView() {
  const [ordenes, setOrdenes] = useState<VentaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [processing, setProcessing] = useState<Record<number, boolean>>({})

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const fetchActivas = useCallback(async () => {
    try {
      const data = await getVentasActivasCocina()
      setOrdenes(data)
    } catch {
      toast.error("Error al cargar órdenes de cocina")
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Handlers de socket ────────────────────────────────────────────────────
  const handleNuevaOrden = useCallback(async (venta: VentaResponse) => {
    try {
      const ventaCompleta = await getVenta(venta.id)

      const debeIgnorar =
        ventaCompleta.detalleventa?.length > 0 &&
        ventaCompleta.detalleventa.every(d => d.producto?.requiereCoccion === false)

      if (debeIgnorar) return

      setOrdenes(prev => {
        if (prev.some(o => o.id === ventaCompleta.id)) return prev
        toast.info(`Nueva orden #${ventaCompleta.numeroOrden}`)
        return [ventaCompleta, ...prev]
      })
    } catch {
      toast.error(`Error al cargar orden #${venta.id}`)
    }
  }, [])

  const handleOrdenActualizada = useCallback(async (venta: VentaResponse) => {
    try {
      const ventaCompleta = await getVenta(venta.id)

      // Si la orden pasó a cancelada, quitarla de cocina
      // (aunque esto lo manejará handleOrdenCancelada, por si acaso)
      const esCancelada = ventaCompleta.idEstatusOrden === 5 // nombre: "cancelada"
      if (esCancelada) {
        setOrdenes(prev => prev.filter(o => o.id !== ventaCompleta.id))
        return
      }

      const debeIgnorar =
        ventaCompleta.detalleventa?.length > 0 &&
        ventaCompleta.detalleventa
          .filter(d => !estaDetalleCancelado(d))
          .every(d => d.producto?.requiereCoccion === false)

      if (debeIgnorar) return

      setOrdenes(prev => {
        const existe = prev.some(o => o.id === ventaCompleta.id)
        if (existe) {
          return prev.map(o => o.id === ventaCompleta.id ? ventaCompleta : o)
        }
        toast.info(`Nueva orden #${ventaCompleta.numeroOrden}`)
        return [ventaCompleta, ...prev]
      })
    } catch {
      toast.error(`Error al actualizar orden #${venta.id}`)
    }
  }, [])

  // Cuando se cancela una orden total → quitarla de la lista de cocina con animación
  const handleOrdenCancelada = useCallback(({ venta_id }: { venta_id: number }) => {
    setOrdenes(prev => {
      const orden = prev.find(o => o.id === venta_id)
      if (orden) {
        toast.info(`Orden #${orden.numeroOrden} cancelada`)
      }
      // Marcamos para animación de salida
      setOrdenesAnimando(prevAnim => [...prevAnim, venta_id])
      setTimeout(() => {
        setOrdenes(prev => prev.filter(o => o.id !== venta_id))
        setOrdenesAnimando(prevAnim => prevAnim.filter(id => id !== venta_id))
      }, 300)
      return prev
    })
  }, [])

  const [ordenesAnimando, setOrdenesAnimando] = useState<number[]>([])

  // ── WebSockets ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchActivas()

    const socket = getSocket()
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    if (socket.connected) setConnected(true)

    onNuevaOrden(handleNuevaOrden)
    onOrdenActualizada(handleOrdenActualizada)
    onOrdenCancelada(handleOrdenCancelada)

    return () => {
      offNuevaOrden(handleNuevaOrden)
      offOrdenActualizada(handleOrdenActualizada)
      offOrdenCancelada(handleOrdenCancelada)
      socket.off("connect")
      socket.off("disconnect")
    }
  }, [fetchActivas, handleNuevaOrden, handleOrdenActualizada, handleOrdenCancelada])

  // ── Acciones ──────────────────────────────────────────────────────────────
  const setProcessingFor = (id: number, value: boolean) =>
    setProcessing(prev => ({ ...prev, [id]: value }))

  const handleIniciarPreparacion = async (ventaId: number) => {
    setProcessingFor(ventaId, true)
    try {
      const updated = await marcarEnPreparacion(ventaId)
      setOrdenes(prev => prev.map(o => o.id === updated.id ? updated : o))
    } catch {
      toast.error("Error al iniciar preparación")
    } finally {
      setProcessingFor(ventaId, false)
    }
  }

  const handleMarcarLista = async (ventaId: number, numeroOrden: number) => {
    setProcessingFor(ventaId, true)
    try {
      const updated = await marcarOrdenLista(ventaId)
      setOrdenes(prev => prev.filter(o => o.id !== updated.id))
      toast.success(`Orden #${numeroOrden} marcada como lista`)
    } catch {
      toast.error("Error al marcar orden como lista")
    } finally {
      setProcessingFor(ventaId, false)
    }
  }

  // ── Helpers de UI ─────────────────────────────────────────────────────────
  const isPendiente     = (o: VentaResponse) => o.idEstatusOrden === 1
  const isEnPreparacion = (o: VentaResponse) => o.idEstatusOrden === 2

  const pendingCount   = ordenes.filter(isPendiente).length
  const preparingCount = ordenes.filter(isEnPreparacion).length

  const getHora = (o: VentaResponse) =>
    new Date(o.fechaApertura).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <ChefHat className="h-7 w-7 text-primary" />
            Cocina
          </h1>
          <p className="text-muted-foreground">Gestiona las órdenes en tiempo real</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium",
            connected
              ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}>
            {connected
              ? <><Wifi className="h-4 w-4" /> En línea</>
              : <><WifiOff className="h-4 w-4" /> Desconectado</>
            }
          </div>
          <div className="rounded-xl border-2 border-border bg-card px-4 py-2">
            <span className="text-sm text-muted-foreground">Pendientes: </span>
            <span className="font-bold text-primary">{pendingCount}</span>
          </div>
          <div className="rounded-xl border-2 border-border bg-card px-4 py-2">
            <span className="text-sm text-muted-foreground">En preparación: </span>
            <span className="font-bold text-foreground">{preparingCount}</span>
          </div>
        </div>
      </div>

      {/* Grid de órdenes */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordenes.map(orden => (
            <div
              key={orden.id}
              className={cn(
                "flex flex-col rounded-2xl border-2 bg-card transition-all duration-300",
                isEnPreparacion(orden)
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border",
                ordenesAnimando.includes(orden.id) && "opacity-0 translate-x-full"
              )}
            >
              {/* Cabecera */}
              <div className="flex items-center justify-between border-b-2 border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">#{orden.numeroOrden}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-lg border-2",
                        orden.idCanalVenta === 3 &&
                        "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                      )}
                    >
                      {orden.idCanalVenta === 3 && <MessageSquare className="mr-1 h-3 w-3" />}
                      {orden.idCanalVenta === 3 ? "WhatsApp" : "Mostrador"}
                    </Badge>
                  </div>
                  {/* Alias del cliente si existe */}
                  {orden.aliasCliente && (
                    <p className="mt-0.5 text-sm font-medium text-primary">{orden.aliasCliente}</p>
                  )}
                  {orden.notas && (
                    <p className="mt-1 text-xs text-muted-foreground italic">"{orden.notas}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{getHora(orden)}</span>
                </div>
              </div>

              {/* Productos */}
              <div className="flex-1 p-4">
                <ul className="space-y-2">
                  {orden.detalleventa
                    ?.filter(d => d.producto?.requiereCoccion)
                    .map(detalle => {
                      const cancelado = estaDetalleCancelado(detalle)
                      return (
                        <li key={detalle.id} className="flex items-start gap-2">
                          <span className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                            cancelado
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted"
                          )}>
                            {detalle.cantidad}
                          </span>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium",
                              cancelado
                                ? "line-through text-destructive/70"
                                : !detalle.cocinado
                                  ? "text-primary font-bold"
                                  : "text-muted-foreground line-through"
                            )}>
                              {detalle.producto?.nombre ?? `Producto #${detalle.idProducto}`}
                            </p>
                            {cancelado && (() => {
                              const info = getCanceladoInfo(detalle);
                              return info ? (
                                <p className="text-xs text-destructive/80 mt-0.5 leading-tight">
                                  <span className="font-medium">Cancelado</span>
                                  {info.usuarioNombre && (
                                    <span className="font-normal"> por {info.usuarioNombre}</span>
                                  )}
                                  {info.motivo && (
                                    <span className="italic"> - {info.motivo}</span>
                                  )}
                                </p>
                              ) : null;
                            })()}
                            {!cancelado && !detalle.cocinado && (
                              <span className="text-xs text-primary">● Nuevo</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </div>

              {/* Acciones */}
              <div className="border-t-2 border-border p-4">
                {isPendiente(orden) ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-2"
                    onClick={() => handleIniciarPreparacion(orden.id)}
                    disabled={processing[orden.id]}
                  >
                    {processing[orden.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar preparación
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => handleMarcarLista(orden.id, orden.numeroOrden)}
                    disabled={processing[orden.id]}
                  >
                    {processing[orden.id]
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Check className="mr-2 h-4 w-4" />}
                    Marcar como lista
                  </Button>
                )}
              </div>
            </div>
          ))}

          {ordenes.length === 0 && (
            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border">
              <ChefHat className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No hay órdenes pendientes</p>
              <p className="text-sm text-muted-foreground">Las nuevas órdenes aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}