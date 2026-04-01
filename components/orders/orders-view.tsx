"use client"

import { useState } from "react"
import { Search, Filter, Calendar, MoreHorizontal, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const orders = [
  {
    id: "ORD-001",
    customer: "Juan Pérez",
    channel: "Mostrador",
    items: 3,
    total: 345.0,
    status: "entregada",
    time: "14:30",
    date: "2025-03-28",
  },
  {
    id: "ORD-002",
    customer: "María García",
    channel: "WhatsApp",
    items: 2,
    total: 180.0,
    status: "lista",
    time: "14:25",
    date: "2025-03-28",
  },
  {
    id: "ORD-003",
    customer: "Cliente mostrador",
    channel: "Mostrador",
    items: 5,
    total: 520.0,
    status: "en_preparacion",
    time: "14:20",
    date: "2025-03-28",
  },
  {
    id: "ORD-004",
    customer: "Carlos López",
    channel: "WhatsApp",
    items: 1,
    total: 100.0,
    status: "pendiente",
    time: "14:15",
    date: "2025-03-28",
  },
  {
    id: "ORD-005",
    customer: "Ana Martínez",
    channel: "Mostrador",
    items: 4,
    total: 410.0,
    status: "entregada",
    time: "13:50",
    date: "2025-03-28",
  },
]

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  en_preparacion: { label: "En preparación", variant: "secondary" },
  lista: { label: "Lista", variant: "default" },
  entregada: { label: "Entregada", variant: "outline" },
}

export function OrdersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Órdenes</h1>
        <p className="text-muted-foreground">
          Gestiona todas las órdenes del sistema
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-[180px] rounded-xl border-2">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_preparacion">En preparación</SelectItem>
            <SelectItem value="lista">Lista</SelectItem>
            <SelectItem value="entregada">Entregada</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="h-11 rounded-xl border-2 gap-2">
          <Calendar className="h-4 w-4" />
          Hoy
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total órdenes</p>
          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-primary">
            {orders.filter((o) => o.status === "pendiente").length}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">En preparación</p>
          <p className="text-2xl font-bold text-foreground">
            {orders.filter((o) => o.status === "en_preparacion").length}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ventas del día</p>
          <p className="text-2xl font-bold text-foreground">
            ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Canal</TableHead>
              <TableHead className="font-semibold">Productos</TableHead>
              <TableHead className="font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Hora</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="rounded-lg border-2"
                  >
                    {order.channel}
                  </Badge>
                </TableCell>
                <TableCell>{order.items} items</TableCell>
                <TableCell className="font-semibold">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusConfig[order.status]?.variant || "outline"}
                    className="rounded-lg"
                  >
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.time}
                </TableCell>
                <TableCell>
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
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
