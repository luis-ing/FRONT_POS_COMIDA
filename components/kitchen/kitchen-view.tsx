"use client"

import { useState } from "react"
import { Check, Clock, ChefHat, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface KitchenOrder {
  id: string
  customer: string
  channel: "Mostrador" | "WhatsApp"
  status: "pendiente" | "en_preparacion"
  time: string
  items: { name: string; quantity: number; notes?: string }[]
}

const initialOrders: KitchenOrder[] = [
  {
    id: "ORD-004",
    customer: "Carlos López",
    channel: "WhatsApp",
    status: "pendiente",
    time: "14:15",
    items: [
      { name: "Tacos al Pastor", quantity: 3 },
      { name: "Agua de Horchata", quantity: 1 },
    ],
  },
  {
    id: "ORD-003",
    customer: "Cliente mostrador",
    channel: "Mostrador",
    status: "en_preparacion",
    time: "14:20",
    items: [
      { name: "Chilaquiles Verdes", quantity: 2, notes: "Sin crema" },
      { name: "Huevos Rancheros", quantity: 1 },
      { name: "Café Americano", quantity: 2 },
    ],
  },
  {
    id: "ORD-005",
    customer: "Ana Rodríguez",
    channel: "WhatsApp",
    status: "pendiente",
    time: "14:22",
    items: [
      { name: "Ensalada César", quantity: 1, notes: "Sin aderezo" },
      { name: "Classic Sirloin", quantity: 1, notes: "Término medio" },
    ],
  },
  {
    id: "ORD-006",
    customer: "Cliente mostrador",
    channel: "Mostrador",
    status: "pendiente",
    time: "14:25",
    items: [
      { name: "Avocado Toast", quantity: 2 },
      { name: "Jugo de Naranja", quantity: 2 },
    ],
  },
]

export function KitchenView() {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)

  const pendingOrders = orders.filter((o) => o.status === "pendiente")
  const preparingOrders = orders.filter((o) => o.status === "en_preparacion")

  const startPreparation = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "en_preparacion" as const } : o
      )
    )
  }

  const markAsReady = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <ChefHat className="h-7 w-7 text-primary" />
            Pantalla de Cocina
          </h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border-2 border-border bg-card px-4 py-2">
            <span className="text-sm text-muted-foreground">Pendientes: </span>
            <span className="font-bold text-primary">
              {pendingOrders.length}
            </span>
          </div>
          <div className="rounded-xl border-2 border-border bg-card px-4 py-2">
            <span className="text-sm text-muted-foreground">
              En preparación:{" "}
            </span>
            <span className="font-bold text-foreground">
              {preparingOrders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={cn(
                "flex flex-col rounded-2xl border-2 bg-card transition-all",
                order.status === "en_preparacion"
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border"
              )}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between border-b-2 border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {order.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-lg border-2",
                        order.channel === "WhatsApp" &&
                          "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                      )}
                    >
                      {order.channel === "WhatsApp" && (
                        <MessageSquare className="mr-1 h-3 w-3" />
                      )}
                      {order.channel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{order.time}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="flex-1 p-4">
                <ul className="space-y-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-primary">{item.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order Actions */}
              <div className="border-t-2 border-border p-4">
                {order.status === "pendiente" ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-2"
                    onClick={() => startPreparation(order.id)}
                  >
                    Iniciar preparación
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => markAsReady(order.id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Marcar como lista
                  </Button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border">
              <ChefHat className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                No hay órdenes pendientes
              </p>
              <p className="text-sm text-muted-foreground">
                Las nuevas órdenes aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
