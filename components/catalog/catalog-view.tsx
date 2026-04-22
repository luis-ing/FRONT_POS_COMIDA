"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Grid3X3, List, SlidersHorizontal, FileText, Loader2, Wifi, WifiOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

import { CategoryGrid } from "./category-grid"
import { ProductGrid } from "./product-grid"
import { CartPanel } from "./cart-panel"
import { PaymentModal } from "./payment-modal"
import { ScrollArea } from "@/components/ui/scroll-area"

import { getProductos } from "@/services/producto_service"
import { getCategorias } from "@/services/categoria_service"
import { getCanalesVenta } from "@/services/catalogo_service"
import {
  crearVentaDirecta,
  abrirOrden,
  agregarProductos,
  enviarACocina,
  cerrarOrden,
  getVenta,
  getVentas,
} from "@/services/venta_service"
import {
  getSocket,
  onNuevaOrden,
  offNuevaOrden,
  onOrdenActualizada,
  offOrdenActualizada,
  onOrdenLista,
  offOrdenLista,
} from "@/services/socket_client"
import type { ProductoResponse, CategoriaResponse, CanalVentaResponse, VentaResponse } from "@/types/schemas"

// ─── Tipos locales ────────────────────────────────────────────────────────────

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  enviadoACocina: boolean
  requiereCoccion: boolean
}

export type SaleFlow = "flujo1" | "flujo2"
export type OrderStatus = "ABIERTA" | "CERRADA"

// Para el panel de órdenes abiertas en el cart (datos mínimos para el dropdown)
export interface OpenOrderSummary {
  id: number   // id real de la venta en BD
  label: string   // ej: "#42"
  total: number
  createdAt: string   // ISO
}

// ─── IDs fijos de catálogo ────────────────────────────────────────────────────
// Ajusta estos valores si tu BD usa IDs distintos
const CANAL_MOSTRADOR_NOMBRE = "Mostrador"

// ─── Componente ───────────────────────────────────────────────────────────────

export function CatalogView() {
  const searchParams = useSearchParams()

  // ── Datos del catálogo ────────────────────────────────────────────────────
  const [productos, setProductos] = useState<ProductoResponse[]>([])
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([])
  const [canales, setCanales] = useState<CanalVentaResponse[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [saleFlow, setSaleFlow] = useState<SaleFlow>("flujo1")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // ── Carrito ───────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  // ── Orden activa (Flujo 2) ────────────────────────────────────────────────
  const [currentVenta, setCurrentVenta] = useState<VentaResponse | null>(null)
  const [openOrders, setOpenOrders] = useState<OpenOrderSummary[]>([])
  const [connected, setConnected] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const fetchCatalog = useCallback(async () => {
    setLoadingData(true)
    try {
      const [prods, cats, cvs] = await Promise.all([
        getProductos({ activo: true }),
        getCategorias(),
        getCanalesVenta(),
      ])
      setProductos(prods)
      setCategorias(cats)
      setCanales(cvs)
    } catch {
      toast.error("Error al cargar el catálogo")
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  // Si venimos de open-orders-view con ?ordenId=X, cargamos esa orden
  useEffect(() => {
    const ordenId = searchParams.get("ordenId")
    if (!ordenId) return
    setSaleFlow("flujo2")
    getVenta(parseInt(ordenId))
      .then(venta => {
        setCurrentVenta(venta)
        // Reconstruimos el carrito desde los detalles de la venta
        const items: CartItem[] = venta.detalleventa.map(d => ({
          id: d.idProducto,
          name: d.producto?.nombre ?? `Producto #${d.idProducto}`,
          price: Number(d.precioUnitario),
          quantity: d.cantidad,
          enviadoACocina: d.enviadoACocina,
          requiereCoccion: d.producto?.requiereCoccion ?? true,
        }))
        setCartItems(items)
        toast.info(`Orden #${venta.id} cargada`)
      })
      .catch(() => toast.error("No se pudo cargar la orden"))
  }, [searchParams])

  // ── Helper: id del canal Mostrador ────────────────────────────────────────
  const getCanalMostrador = () => {
    const canal = canales.find(c => c.canal === CANAL_MOSTRADOR_NOMBRE)
    if (!canal) throw new Error("Canal Mostrador no encontrado en catálogos")
    return canal.id
  }

  const mapVentaToOpenOrder = useCallback((venta: VentaResponse): OpenOrderSummary => ({
    id: venta.id,
    label: `#${venta.id}`,
    total: Number(venta.total),
    createdAt: venta.fechaApertura,
  }), [])

  const fetchOpenOrders = useCallback(async () => {
    try {
      const ventas = await getVentas({ idEstatusPago: 1 })
      setOpenOrders(ventas.map(mapVentaToOpenOrder))
    } catch {
      toast.error("Error al cargar órdenes abiertas")
    }
  }, [mapVentaToOpenOrder])

  useEffect(() => {
    fetchOpenOrders()
  }, [fetchOpenOrders])

  const handleNuevaOrdenSocket = useCallback(async (venta: VentaResponse) => {
    if (venta.idEstatusPago !== 1) {
      setOpenOrders(prev => prev.filter(o => o.id !== venta.id))
      return
    }

    setOpenOrders(prev =>
      prev.some(o => o.id === venta.id)
        ? prev
        : [mapVentaToOpenOrder(venta), ...prev]
    )
  }, [mapVentaToOpenOrder])

  const handleOrdenActualizadaSocket = useCallback(async (venta: VentaResponse) => {
    if (venta.idEstatusPago !== 1) {
      setOpenOrders(prev => prev.filter(o => o.id !== venta.id))
      return
    }

    setOpenOrders(prev =>
      prev.some(o => o.id === venta.id)
        ? prev.map(o => o.id === venta.id ? mapVentaToOpenOrder(venta) : o)
        : [mapVentaToOpenOrder(venta), ...prev]
    )
  }, [mapVentaToOpenOrder])

  const handleOrdenListaSocket = useCallback(async ({ venta_id }: { venta_id: number }) => {
    try {
      const venta = await getVenta(venta_id)
      if (venta.idEstatusPago !== 1) {
        setOpenOrders(prev => prev.filter(o => o.id !== venta_id))
        return
      }
      setOpenOrders(prev =>
        prev.some(o => o.id === venta.id)
          ? prev.map(o => o.id === venta.id ? mapVentaToOpenOrder(venta) : o)
          : [mapVentaToOpenOrder(venta), ...prev]
      )
      toast.success(`Orden #${venta_id} está lista`)
    } catch {
      toast.success(`Orden #${venta_id} está lista`)
    }
  }, [mapVentaToOpenOrder])

  useEffect(() => {
    const socket = getSocket()
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    if (socket.connected) setConnected(true)

    onNuevaOrden(handleNuevaOrdenSocket)
    onOrdenActualizada(handleOrdenActualizadaSocket)
    onOrdenLista(handleOrdenListaSocket)

    return () => {
      offNuevaOrden(handleNuevaOrdenSocket)
      offOrdenActualizada(handleOrdenActualizadaSocket)
      offOrdenLista(handleOrdenListaSocket)
      socket.off("connect")
      socket.off("disconnect")
    }
  }, [handleNuevaOrdenSocket, handleOrdenActualizadaSocket, handleOrdenListaSocket])

  // ── Agregar al carrito ────────────────────────────────────────────────────
  const addToCart = (producto: ProductoResponse) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === producto.id && !i.enviadoACocina)
      if (existing) {
        return prev.map(i =>
          i.id === producto.id && !i.enviadoACocina
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, {
        id: producto.id,
        name: producto.nombre,
        price: Number(producto.precio),
        quantity: 1,
        enviadoACocina: false,
        requiereCoccion: producto.requiereCoccion,
      }]
    })
  }

  const updateQuantity = (id: number, quantity: number, enviadoACocina: boolean) => {
    if (enviadoACocina) return
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => !(i.id === id && !i.enviadoACocina)))
    } else {
      setCartItems(prev => prev.map(i =>
        i.id === id && !i.enviadoACocina ? { ...i, quantity } : i
      ))
    }
  }

  const clearCart = () => setCartItems(prev => prev.filter(i => i.enviadoACocina))

  // ── Helpers de items ──────────────────────────────────────────────────────
  const pendingItems = cartItems.filter(i => !i.enviadoACocina)

  const buildProductosPayload = (items: CartItem[]) =>
    items.map(i => ({ idProducto: i.id, cantidad: i.quantity }))

  // ── FLUJO 1: Cobro inmediato ──────────────────────────────────────────────
  // El modal de pago llama a onConfirmPayment con el idMetodoPago elegido.
  // Aquí hacemos la llamada real al backend.
  const handleConfirmPaymentFlujo1 = async (idMetodoPago: number) => {
    setSubmitting(true)
    try {
      const idCanalVenta = getCanalMostrador()
      await crearVentaDirecta({
        idMetodoPago,
        idCanalVenta,
        productos: buildProductosPayload(cartItems),
      })
      setCartItems([])
      toast.success("Venta registrada correctamente")
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al registrar la venta"
      toast.error(msg)
      throw err // Re-lanzamos para que PaymentModal no muestre éxito
    } finally {
      setSubmitting(false)
    }
  }

  // ── FLUJO 2: Abrir orden ──────────────────────────────────────────────────
  const handleOpenOrder = async () => {
    if (pendingItems.length === 0) return
    setSubmitting(true)
    try {
      const idCanalVenta = getCanalMostrador()

      // 1. Abrimos la orden
      const venta = await abrirOrden({ idCanalVenta })

      // 2. Agregamos los productos
      await agregarProductos(venta.id, {
        productos: buildProductosPayload(pendingItems),
      })

      // 3. Enviamos a cocina los que lo requieran
      const ventaFinal = await enviarACocina(venta.id)

      setCurrentVenta(ventaFinal)

      // Marcamos como enviados en el carrito
      setCartItems(prev => prev.map(i => ({ ...i, enviadoACocina: true })))

      // Agregamos al resumen de órdenes abiertas (dropdown)
      setOpenOrders(prev => [...prev, {
        id: ventaFinal.id,
        label: `#${ventaFinal.id}`,
        total: Number(ventaFinal.total),
        createdAt: ventaFinal.fechaApertura,
      }])

      toast.success(`Orden #${ventaFinal.id} abierta y enviada a cocina`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al abrir la orden")
    } finally {
      setSubmitting(false)
    }
  }

  // ── FLUJO 2: Agregar productos a orden abierta ────────────────────────────
  const handleAddToOpenOrder = async () => {
    if (!currentVenta || pendingItems.length === 0) return
    setSubmitting(true)
    try {
      // 1. Agregar productos
      await agregarProductos(currentVenta.id, {
        productos: buildProductosPayload(pendingItems),
      })

      // 2. Enviar a cocina
      const ventaFinal = await enviarACocina(currentVenta.id)
      setCurrentVenta(ventaFinal)

      setCartItems(prev => prev.map(i => ({ ...i, enviadoACocina: true })))

      // Actualizar total en el dropdown
      setOpenOrders(prev => prev.map(o =>
        o.id === ventaFinal.id
          ? { ...o, total: Number(ventaFinal.total) }
          : o
      ))

      toast.success("Productos enviados a cocina")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al agregar productos")
    } finally {
      setSubmitting(false)
    }
  }

  // ── FLUJO 2: Cerrar y cobrar ──────────────────────────────────────────────
  const handleConfirmPaymentFlujo2 = async (idMetodoPago: number) => {
    if (!currentVenta) return
    setSubmitting(true)
    try {
      await cerrarOrden(currentVenta.id, { idMetodoPago })
      setCartItems([])
      setCurrentVenta(null)
      setOpenOrders(prev => prev.filter(o => o.id !== currentVenta.id))
      toast.success(`Orden #${currentVenta.id} cerrada y cobrada`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al cerrar la orden")
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  // ── Cargar orden abierta desde dropdown ───────────────────────────────────
  const handleLoadOrder = async (ventaId: number) => {
    try {
      const venta = await getVenta(ventaId)
      setCurrentVenta(venta)
      const items: CartItem[] = venta.detalleventa.map(d => ({
        id: d.idProducto,
        name: d.producto?.nombre ?? `Producto #${d.idProducto}`,
        price: Number(d.precioUnitario),
        quantity: d.cantidad,
        enviadoACocina: d.enviadoACocina,
        requiereCoccion: d.producto?.requiereCoccion ?? true,
      }))
      setCartItems(items)
      setSaleFlow("flujo2")
      toast.info(`Orden #${venta.id} cargada`)
    } catch {
      toast.error("Error al cargar la orden")
    }
  }

  const handleNewSale = () => {
    setCartItems([])
    setCurrentVenta(null)
  }

  // ── Seleccionar categoría con toggle ──────────────────────────────────────
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(prev => prev === categoryId ? null : categoryId)
  }

  // ── Dispatch de pago según flujo ──────────────────────────────────────────
  const handleConfirmPayment = async (idMetodoPago: number) => {
    if (saleFlow === "flujo1") {
      await handleConfirmPaymentFlujo1(idMetodoPago)
    } else {
      await handleConfirmPaymentFlujo2(idMetodoPago)
    }
  }

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filteredProducts = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategoryId || p.idCategoria === selectedCategoryId
    return matchesSearch && matchesCategory
  })

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6">
        {/* Búsqueda */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl border-2 pl-12 text-base"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Selector de flujo */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border-2 border-border bg-muted/50 p-1">
              <Button
                variant={saleFlow === "flujo1" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => { setSaleFlow("flujo1"); handleNewSale() }}
              >
                Cobro inmediato
              </Button>
              <Button
                variant={saleFlow === "flujo2" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setSaleFlow("flujo2")}
              >
                Orden abierta
              </Button>
            </div>
            {openOrders.length > 0 && (
              <Badge variant="outline" className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary">
                <FileText className="mr-1 h-3 w-3" />
                {openOrders.length} órdenes abiertas
              </Badge>
            )}
          </div>


          {/* Vista */}
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2 rounded-xl border-2 border-border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Categorías */}
        <CategoryGrid
          categories={categorias.map(c => ({
            id: c.id,
            name: c.nombre,
            count: productos.filter(p => p.idCategoria === c.id).length,
            color: c.color ?? "#6b7280",
          }))}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleCategorySelect}
        />

        {/* Productos */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <h3 className="mb-4 text-lg font-medium">Productos</h3>
          <ScrollArea className="flex-1 min-h-0">
            <ProductGrid
              products={filteredProducts.map(p => ({
                id: p.id,
                name: p.nombre,
                price: Number(p.precio),
                image: p.imagenURL,
                category: p.categoria?.nombre ?? "",
                requiereCoccion: p.requiereCoccion,
              }))}
              viewMode={viewMode}
              onAddToCart={item => {
                const prod = productos.find(p => p.id === item.id)
                if (prod) addToCart(prod)
              }}
              cartItems={cartItems}
            />
          </ScrollArea>
        </div>
      </div>

      {/* Panel carrito */}
      <CartPanel
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        saleFlow={saleFlow}
        currentOrderId={currentVenta ? currentVenta.id : null}
        onPayment={() => setIsPaymentOpen(true)}
        onOpenOrder={handleOpenOrder}
        onAddToOpenOrder={handleAddToOpenOrder}
        onSendToKitchen={handleAddToOpenOrder}
        onNewSale={handleNewSale}
        openOrders={openOrders}
        onLoadOrder={handleLoadOrder}
        submitting={submitting}
      />

      {/* Modal de pago */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        items={cartItems}
        total={subtotal}
        onConfirmPayment={handleConfirmPayment}
        isClosingOrder={saleFlow === "flujo2" && currentVenta !== null}
      />
    </div>
  )
}