"use client"

import { useState } from "react"
import { Search, Grid3X3, List, SlidersHorizontal, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryGrid } from "./category-grid"
import { ProductGrid } from "./product-grid"
import { CartPanel } from "./cart-panel"
import { PaymentModal } from "./payment-modal"

const categories = [
  { id: 1, name: "Entradas", count: 8, color: "bg-category-yellow" },
  { id: 2, name: "Sopas", count: 6, color: "bg-category-green" },
  { id: 3, name: "Ensaladas", count: 5, color: "bg-category-purple" },
  { id: 4, name: "Desayunos", count: 12, color: "bg-category-blue" },
  { id: 5, name: "Platillos", count: 15, color: "bg-category-pink" },
  { id: 6, name: "Extras", count: 11, color: "bg-category-purple" },
  { id: 7, name: "Postres", count: 6, color: "bg-category-green" },
  { id: 8, name: "Bebidas", count: 21, color: "bg-category-blue" },
]

const products = [
  {
    id: 1,
    name: "Cerveza clara",
    price: 65.0,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&h=200&fit=crop",
    category: "Bebidas",
    requiereCoccion: false,
  },
  {
    id: 2,
    name: "Avocado Toast con Huevo",
    price: 100.0,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop",
    category: "Desayunos",
    requiereCoccion: true,
  },
  {
    id: 3,
    name: "Chilaquiles Verdes con Pollo",
    price: 140.0,
    image: "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=200&h=200&fit=crop",
    category: "Desayunos",
    requiereCoccion: true,
  },
  {
    id: 4,
    name: "Tacos al Pastor",
    price: 100.0,
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop",
    category: "Platillos",
    requiereCoccion: true,
  },
  {
    id: 5,
    name: "Classic Sirloin",
    price: 220.0,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200&h=200&fit=crop",
    category: "Platillos",
    requiereCoccion: true,
  },
  {
    id: 6,
    name: "Ensalada César",
    price: 95.0,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop",
    category: "Ensaladas",
    requiereCoccion: false,
  },
]

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  enviadoACocina: boolean
  requiereCoccion: boolean
}

// Types for order management
export type SaleFlow = "flujo1" | "flujo2"
export type OrderStatus = "ABIERTA" | "CERRADA"

export interface OpenOrder {
  id: string
  items: CartItem[]
  total: number
  status: OrderStatus
  createdAt: Date
  notes?: string
}

export function CatalogView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [saleFlow, setSaleFlow] = useState<SaleFlow>("flujo1")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)

  const addToCart = (product: (typeof products)[0]) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.enviadoACocina)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.enviadoACocina
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        enviadoACocina: false, 
        requiereCoccion: product.requiereCoccion 
      }]
    })
  }

  const updateQuantity = (id: number, quantity: number, enviadoACocina: boolean) => {
    // No permitir modificar items ya enviados a cocina
    if (enviadoACocina) return
    
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => !(item.id === id && !item.enviadoACocina)))
    } else {
      setCartItems((prev) =>
        prev.map((item) => 
          (item.id === id && !item.enviadoACocina) 
            ? { ...item, quantity } 
            : item
        )
      )
    }
  }

  const clearCart = () => {
    // Solo limpiar items no enviados a cocina
    setCartItems((prev) => prev.filter(item => item.enviadoACocina))
  }

  const handleSendToKitchen = () => {
    // Marcar items como enviados a cocina
    setCartItems((prev) =>
      prev.map((item) => ({ ...item, enviadoACocina: true }))
    )
    // Aquí se emitiría el socket "nueva_orden" o "orden_actualizada"
  }

  const handleOpenOrder = () => {
    // Flujo 2: Abrir orden
    const newOrderId = `ORD-${Date.now()}`
    const newOrder: OpenOrder = {
      id: newOrderId,
      items: [...cartItems],
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "ABIERTA",
      createdAt: new Date(),
    }
    setOpenOrders((prev) => [...prev, newOrder])
    setCurrentOrderId(newOrderId)
    handleSendToKitchen()
  }

  const handleAddToOpenOrder = () => {
    if (!currentOrderId) return
    
    // Agregar items a la orden abierta actual
    const pendingItems = cartItems.filter(item => !item.enviadoACocina)
    
    setOpenOrders((prev) =>
      prev.map((order) =>
        order.id === currentOrderId
          ? {
              ...order,
              items: [...order.items, ...pendingItems.map(i => ({ ...i, enviadoACocina: true }))],
              total: order.total + pendingItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            }
          : order
      )
    )
    
    handleSendToKitchen()
  }

  const handlePayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = (methodId: number) => {
    // Cerrar la orden
    if (currentOrderId) {
      setOpenOrders((prev) =>
        prev.map((order) =>
          order.id === currentOrderId
            ? { ...order, status: "CERRADA" as OrderStatus }
            : order
        )
      )
      setCurrentOrderId(null)
    }
    
    // Limpiar carrito
    setCartItems([])
    setIsPaymentModalOpen(false)
  }

  const handleNewSale = () => {
    setCartItems([])
    setCurrentOrderId(null)
  }

  const handleLoadOrder = (orderId: string) => {
    const order = openOrders.find(o => o.id === orderId)
    if (order && order.status === "ABIERTA") {
      setCartItems(order.items)
      setCurrentOrderId(orderId)
      setSaleFlow("flujo2")
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const pendingItems = cartItems.filter(item => !item.enviadoACocina)
  const sentItems = cartItems.filter(item => item.enviadoACocina)

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl border-2 pl-12 text-base"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-2"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Sale Flow Selector + Open Orders Badge */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border-2 border-border bg-muted/50 p-1">
              <Button
                variant={saleFlow === "flujo1" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  setSaleFlow("flujo1")
                  handleNewSale()
                }}
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
            
            {openOrders.filter(o => o.status === "ABIERTA").length > 0 && (
              <Badge variant="outline" className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary">
                <FileText className="mr-1 h-3 w-3" />
                {openOrders.filter(o => o.status === "ABIERTA").length} órdenes abiertas
              </Badge>
            )}
          </div>
        </div>

        {/* Products Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Productos</h2>
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

        {/* Categories */}
        <CategoryGrid categories={categories} />

        {/* Products */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Favoritos de los clientes</h3>
          <ProductGrid
            products={filteredProducts}
            viewMode={viewMode}
            onAddToCart={addToCart}
            cartItems={cartItems}
          />
        </div>
      </div>

      {/* Cart Panel */}
      <CartPanel
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        saleFlow={saleFlow}
        currentOrderId={currentOrderId}
        onPayment={handlePayment}
        onOpenOrder={handleOpenOrder}
        onAddToOpenOrder={handleAddToOpenOrder}
        onSendToKitchen={handleSendToKitchen}
        onNewSale={handleNewSale}
        openOrders={openOrders.filter(o => o.status === "ABIERTA")}
        onLoadOrder={handleLoadOrder}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        items={cartItems}
        total={subtotal}
        onConfirmPayment={handleConfirmPayment}
        isClosingOrder={saleFlow === "flujo2" && currentOrderId !== null}
      />
    </div>
  )
}
