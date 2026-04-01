"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Phone,
  MapPin,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const customers = [
  {
    id: 1,
    name: "Juan Pérez",
    phone: "+52 55 1234 5678",
    address: "Av. Insurgentes Sur 1234, CDMX",
    orders: 15,
    totalSpent: 2450.0,
  },
  {
    id: 2,
    name: "María García",
    phone: "+52 55 9876 5432",
    address: "Calle Roma 567, Col. Roma Norte",
    orders: 8,
    totalSpent: 1320.0,
  },
  {
    id: 3,
    name: "Carlos López",
    phone: "+52 55 5555 4444",
    address: "Av. Chapultepec 890, CDMX",
    orders: 23,
    totalSpent: 4100.0,
  },
  {
    id: 4,
    name: "Ana Martínez",
    phone: "+52 55 3333 2222",
    address: "Calle Durango 123, Col. Roma",
    orders: 5,
    totalSpent: 750.0,
  },
  {
    id: 5,
    name: "Roberto Sánchez",
    phone: "+52 55 7777 8888",
    address: "Av. Reforma 456, CDMX",
    orders: 12,
    totalSpent: 1980.0,
  },
]

export function CustomersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes registrados en el sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Agregar nuevo cliente</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Pérez"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="Ej: +52 55 1234 5678"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección de entrega</Label>
                <Input
                  id="address"
                  placeholder="Ej: Av. Insurgentes Sur 1234"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 rounded-xl">
                  Guardar cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total clientes</p>
          <p className="text-2xl font-bold text-foreground">
            {customers.length}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Órdenes totales</p>
          <p className="text-2xl font-bold text-foreground">
            {customers.reduce((sum, c) => sum + c.orders, 0)}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ingresos totales</p>
          <p className="text-2xl font-bold text-primary">
            ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-xl border-2 border-border">
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {customer.name}
                    </h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{customer.address}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t-2 border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Órdenes</p>
                  <p className="font-semibold text-foreground">
                    {customer.orders}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total gastado</p>
                  <p className="font-semibold text-primary">
                    ${customer.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
