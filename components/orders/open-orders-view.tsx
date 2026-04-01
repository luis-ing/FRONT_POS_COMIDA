"use client"

import { useState } from "react"
import {
  Search,
  Clock,
  ChefHat,
  Plus,
  ArrowRight,
  Banknote,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Printer,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: number
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  enviadoACocina: boolean
  requiereCoccion: boolean
}

interface OpenOrder {
  id: string
  items: OrderItem[]
  total: number
  estatusOrden: "pendiente" | "en_preparacion" | "lista"
  notas?: string
  fechaApertura: Date
  mesa?: string
  cliente?: string
}

// Mock data
const mockOpenOrders: OpenOrder[] = [
  {
    id: "ORD-001",
    items: [
      { id: 1, nombre: "Tacos al Pastor", cantidad: 3, precioUnitario: 100, subtotal: 300, enviadoACocina: true, requiereCoccion: true },
      { id: 2, nombre: "Cerveza Clara", cantidad: 2, precioUnitario: 65, subtotal: 130, enviadoACocina: true, requiereCoccion: false },
    ],
    total: 430,
    estatusOrden: "en_preparacion",
    fechaApertura: new Date(Date.now() - 15 * 60000),
    mesa: "Mesa 4",
  },
  {
    id: "ORD-002",
    items: [
      { id: 3, nombre: "Chilaquiles Verdes", cantidad: 2, precioUnitario: 140, subtotal: 280, enviadoACocina: true, requiereCoccion: true },
      { id: 4, nombre: "Café Americano", cantidad: 2, precioUnitario: 45, subtotal: 90, enviadoACocina: true, requiereCoccion: false },
    ],
    total: 370,
    estatusOrden: "lista",
    fechaApertura: new Date(Date.now() - 25 * 60000),
    mesa: "Mesa 7",
  },
  {
    id: "ORD-003",
    items: [
      { id: 5, nombre: "Ensalada César", cantidad: 1, precioUnitario: 95, subtotal: 95, enviadoACocina: true, requiereCoccion: false },
      { id: 6, nombre: "Classic Sirloin", cantidad: 2, precioUnitario: 220, subtotal: 440, enviadoACocina: true, requiereCoccion: true },
      { id: 7, nombre: "Agua Mineral", cantidad: 3, precioUnitario: 35, subtotal: 105, enviadoACocina: true, requiereCoccion: false },
    ],
    total: 640,
    estatusOrden: "pendiente",
    fechaApertura: new Date(Date.now() - 5 * 60000),
    mesa: "Mesa 2",
    notas: "Sin cebolla en los tacos",
  },
  {
    id: "ORD-004",
    items: [
      { id: 8, nombre: "Sopa Azteca", cantidad: 4, precioUnitario: 85, subtotal: 340, enviadoACocina: true, requiereCoccion: true },
    ],
    total: 340,
    estatusOrden: "en_preparacion",
    fechaApertura: new Date(Date.now() - 10 * 60000),
    cliente: "Juan Pérez",
  },
]

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    bgCard: "border-yellow-500/20",
  },
  en_preparacion: {
    label: "En preparación",
    color: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    bgCard: "border-orange-500/20",
  },
  lista: {
    label: "Lista",
    color: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    bgCard: "border-green-500/20",
  },
}

export function OpenOrdersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OpenOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredOrders = mockOpenOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.mesa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.cliente?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  }

  const getElapsedTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const handleViewDetails = (order: OpenOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const stats = {
    total: mockOpenOrders.length,
    pendientes: mockOpenOrders.filter((o) => o.estatusOrden === "pendiente").length,
    enPreparacion: mockOpenOrders.filter((o) => o.estatusOrden === "en_preparacion").length,
    listas: mockOpenOrders.filter((o) => o.estatusOrden === "lista").length,
    totalVentas: mockOpenOrders.reduce((sum, o) => sum + o.total, 0),
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes Abiertas</h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes pendientes de cobro
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-2 gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button className="rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            Nueva orden
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
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pendientes}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400">En preparación</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.enPreparacion}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-green-500/20 bg-green-500/5 p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Listas para cobrar</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.listas}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary">Total pendiente</p>
          <p className="text-2xl font-bold text-primary">${stats.totalVentas.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por orden, mesa o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.estatusOrden]
            return (
              <div
                key={order.id}
                className={cn(
                  "group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg",
                  config.bgCard
                )}
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{order.id}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTime(order.fechaApertura)} ({getElapsedTime(order.fechaApertura)})
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Agregar productos
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar orden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badge + Location */}
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline" className={cn("rounded-lg border-2", config.color)}>
                    {config.label}
                  </Badge>
                  {order.mesa && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {order.mesa}
                    </span>
                  )}
                  {order.cliente && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {order.cliente}
                    </span>
                  )}
                </div>

                {/* Items preview */}
                <div className="mb-4 flex-1">
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {item.cantidad}x
                          </span>
                          {item.nombre}
                          {item.requiereCoccion && (
                            <ChefHat className="h-3 w-3 text-orange-500" />
                          )}
                        </span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} productos más
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notas && (
                  <div className="mb-4 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                    {order.notas}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-lg font-bold text-foreground">
                    ${order.total.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    className="rounded-xl gap-1"
                    disabled={order.estatusOrden !== "lista"}
                  >
                    <Banknote className="h-4 w-4" />
                    Cobrar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrder?.id}
              {selectedOrder && (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg border-2",
                    statusConfig[selectedOrder.estatusOrden].color
                  )}
                >
                  {statusConfig[selectedOrder.estatusOrden].label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Abierta: {formatTime(selectedOrder.fechaApertura)}
                </span>
                <span className="text-muted-foreground">
                  Tiempo: {getElapsedTime(selectedOrder.fechaApertura)}
                </span>
              </div>

              {selectedOrder.mesa && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Mesa:</span>{" "}
                  <span className="font-medium">{selectedOrder.mesa}</span>
                </p>
              )}

              {/* Items */}
              <div className="rounded-xl border-2 border-border">
                <div className="border-b border-border px-4 py-2">
                  <p className="font-medium">Productos</p>
                </div>
                <ScrollArea className="max-h-60">
                  <div className="p-4 space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.cantidad}x</span>
                          <span>{item.nombre}</span>
                          {item.requiereCoccion && (
                            <ChefHat className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <span className="font-medium">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Notes */}
              {selectedOrder.notas && (
                <div className="rounded-xl border-2 border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-1">Notas</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.notas}
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ${selectedOrder.total.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Cerrar
                </Button>
                <Button className="flex-1 rounded-xl gap-2">
                  <Banknote className="h-4 w-4" />
                  Cobrar orden
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
