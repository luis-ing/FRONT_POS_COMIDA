"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Phone, MapPin, MoreHorizontal, Edit2, Trash2, Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { getClientes, createCliente } from "@/services/cliente_service"
import type { ClienteResponse } from "@/types/schemas"

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

const EMPTY_FORM = { nombreCompleto: "", celular: "", direccionEntrega: "" }

export function CustomersView() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [clientes,  setClientes]  = useState<ClienteResponse[]>([])
  const [loading,   setLoading]   = useState(true)

  // ── Filtros / form ────────────────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClienteResponse | null>(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [submitting,   setSubmitting]   = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientes()
      setClientes(data)
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  // ── Búsqueda con debounce por celular (llama al backend) ──────────────────
  // Si el query parece un número, buscamos en el backend directamente
  useEffect(() => {
    const isPhone = /^\d/.test(searchQuery.trim())
    if (!isPhone || searchQuery.length < 3) return

    const timer = setTimeout(async () => {
      try {
        const data = await getClientes(searchQuery.trim())
        setClientes(data)
      } catch {
        toast.error("Error al buscar clientes")
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Si el query se limpia, recargamos todos
  useEffect(() => {
    if (searchQuery === "") fetchClientes()
  }, [searchQuery, fetchClientes])

  // ── Filtrado local por nombre ─────────────────────────────────────────────
  const filtered = clientes.filter(c =>
    c.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.celular ?? "").includes(searchQuery)
  )

  // ── Abrir diálogo ─────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (c: ClienteResponse) => {
    setEditingClient(c)
    setForm({
      nombreCompleto:   c.nombreCompleto,
      celular:          c.celular ?? "",
      direccionEntrega: c.direccionEntrega ?? "",
    })
    setIsDialogOpen(true)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.nombreCompleto.trim()) {
      toast.error("El nombre del cliente es requerido")
      return
    }
    setSubmitting(true)
    try {
      if (editingClient) {
        // El backend no expone PATCH /clientes/:id aún — mostrar aviso
        toast.info("La edición de clientes no está disponible todavía en el backend")
      } else {
        const created = await createCliente({
          nombreCompleto:   form.nombreCompleto,
          celular:          form.celular || undefined,
          direccionEntrega: form.direccionEntrega || undefined,
        })
        setClientes(prev => [created, ...prev])
        toast.success("Cliente creado exitosamente")
      }
      setIsDialogOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al guardar el cliente"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestiona los clientes registrados en el sistema</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2" onClick={openNew}>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar cliente" : "Agregar nuevo cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  value={form.nombreCompleto}
                  onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono / WhatsApp</Label>
                <Input
                  placeholder="Ej: +52 55 1234 5678"
                  value={form.celular}
                  onChange={e => setForm(f => ({ ...f, celular: e.target.value }))}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección de entrega</Label>
                <Input
                  placeholder="Ej: Av. Insurgentes Sur 1234"
                  value={form.direccionEntrega}
                  onChange={e => setForm(f => ({ ...f, direccionEntrega: e.target.value }))}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingClient ? "Guardar cambios" : "Guardar cliente"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-2 pl-12"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total clientes</p>
          <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Con WhatsApp</p>
          <p className="text-2xl font-bold text-foreground">
            {clientes.filter(c => c.celular).length}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Con dirección</p>
          <p className="text-2xl font-bold text-primary">
            {clientes.filter(c => c.direccionEntrega).length}
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(cliente => (
              <div
                key={cliente.id}
                className="rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border-2 border-border">
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                        {getInitials(cliente.nombreCompleto)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{cliente.nombreCompleto}</h3>
                      {cliente.celular && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {cliente.celular}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(cliente)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" disabled>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {cliente.direccionEntrega && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{cliente.direccionEntrega}</span>
                  </div>
                )}

                <div className="mt-4 border-t-2 border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Registrado: {new Date(cliente.fechaCreacion).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                <p className="font-medium">No se encontraron clientes</p>
                <p className="text-sm">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}