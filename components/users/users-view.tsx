"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, MoreHorizontal, Edit2, UserX, UserCheck, Users, Shield, Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import {
  getUsuarios, createUsuario, updateUsuario, desactivarUsuario,
} from "@/services/usuario_service"
import { getRoles } from "@/services/rol_service"
import type { UsuarioResponse, RolResponse } from "@/types/schemas"
import { RolesView } from "./roles-view"

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (nombre: string, apellidos: string | null) =>
  `${nombre.charAt(0)}${apellidos?.charAt(0) ?? ""}`.toUpperCase()

const ROL_COLORS: Record<string, string> = {
  Administrador: "bg-primary/10 text-primary border-primary/30",
  Vendedor:      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Cocinero:      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  Supervisor:    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
}

const EMPTY_FORM = { nombre: "", apellidos: "", correo: "", contrasena: "", idRol: "" }

// ── Componente ────────────────────────────────────────────────────────────────

export function UsersView() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([])
  const [roles,    setRoles]    = useState<RolResponse[]>([])
  const [loading,  setLoading]  = useState(true)

  // ── Filtros / form ────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("")
  const [isDialogOpen,  setIsDialogOpen]  = useState(false)
  const [editingUser,   setEditingUser]   = useState<UsuarioResponse | null>(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [submitting,    setSubmitting]    = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsuarios(), getRoles()])
      setUsuarios(u)
      setRoles(r)
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Filtrado local ────────────────────────────────────────────────────────
  const filtered = usuarios.filter(u =>
    `${u.nombre} ${u.apellidos ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Abrir diálogos ────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (u: UsuarioResponse) => {
    setEditingUser(u)
    setForm({
      nombre:     u.nombre,
      apellidos:  u.apellidos ?? "",
      correo:     u.correo,
      contrasena: "",              // nunca pre-rellenamos la contraseña
      idRol:      u.rol ? String(u.rol.id) : "",
    })
    setIsDialogOpen(true)
  }

  // ── Submit crear / editar ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.nombre || !form.correo || !form.idRol) {
      toast.error("Nombre, correo y rol son requeridos")
      return
    }
    if (!editingUser && !form.contrasena) {
      toast.error("La contraseña es requerida para nuevos usuarios")
      return
    }
    setSubmitting(true)
    try {
      if (editingUser) {
        const updated = await updateUsuario(editingUser.id, {
          nombre:    form.nombre    || undefined,
          apellidos: form.apellidos || undefined,
          correo:    form.correo    || undefined,
          contrasena: form.contrasena || undefined,
          idRol:     parseInt(form.idRol),
        })
        setUsuarios(prev => prev.map(u => u.id === updated.id ? updated : u))
        toast.success("Usuario actualizado")
      } else {
        const created = await createUsuario({
          nombre:     form.nombre,
          apellidos:  form.apellidos || undefined,
          correo:     form.correo,
          contrasena: form.contrasena,
          idRol:      parseInt(form.idRol),
        })
        setUsuarios(prev => [created, ...prev])
        toast.success("Usuario creado")
      }
      setIsDialogOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al guardar el usuario"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Desactivar ────────────────────────────────────────────────────────────
  const handleDesactivar = async (u: UsuarioResponse) => {
    try {
      await desactivarUsuario(u.id)
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: false } : x))
      toast.success(`${u.nombre} desactivado`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al desactivar el usuario"
      toast.error(msg)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
        <p className="text-muted-foreground">Gestiona los usuarios del sistema y sus permisos de acceso</p>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="w-fit rounded-xl border-2 border-border bg-muted/50 p-1">
          <TabsTrigger value="users" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Shield className="h-4 w-4" /> Roles y Permisos
          </TabsTrigger>
        </TabsList>

        {/* ── USUARIOS ── */}
        <TabsContent value="users" className="flex-1 flex flex-col mt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-11 w-72 rounded-xl border-2 pl-12"
              />
            </div>

            {/* Diálogo crear / editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2" onClick={openNew}>
                  <Plus className="h-4 w-4" /> Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar usuario" : "Crear nuevo usuario"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Nombre"
                        value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        className="rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellidos</Label>
                      <Input
                        placeholder="Apellidos"
                        value={form.apellidos}
                        onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                        className="rounded-xl border-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correo electrónico *</Label>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={form.correo}
                      onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.contrasena}
                      onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol *</Label>
                    <Select
                      value={form.idRol}
                      onValueChange={v => setForm(f => ({ ...f, idRol: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {roles.map(r => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {editingUser ? "Guardar cambios" : "Crear usuario"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { label: "Total usuarios",    value: usuarios.length,                              color: "text-foreground" },
              { label: "Activos",           value: usuarios.filter(u => u.activo).length,        color: "text-primary" },
              { label: "Inactivos",         value: usuarios.filter(u => !u.activo).length,       color: "text-muted-foreground" },
              { label: "Roles disponibles", value: roles.filter(r => r.activo).length,           color: "text-foreground" },
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
                    <TableHead className="font-semibold">Usuario</TableHead>
                    <TableHead className="font-semibold">Correo</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Creado</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border-2 border-border">
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm">
                              {getInitials(u.nombre, u.apellidos)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {u.nombre}{u.apellidos ? ` ${u.apellidos}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.correo}</TableCell>
                      <TableCell>
                        {u.rol ? (
                          <Badge
                            variant="outline"
                            className={`rounded-lg border-2 ${ROL_COLORS[u.rol.nombre] ?? ""}`}
                          >
                            {u.rol.nombre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.activo ? "default" : "outline"} className="rounded-lg">
                          {u.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.fechaCreacion).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            {u.activo && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDesactivar(u)}
                                >
                                  <UserX className="mr-2 h-4 w-4" /> Desactivar
                                </DropdownMenuItem>
                              </>
                            )}
                            {!u.activo && (
                              <DropdownMenuItem disabled>
                                <UserCheck className="mr-2 h-4 w-4" /> Inactivo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ── ROLES ── */}
        <TabsContent value="roles" className="flex-1 mt-4">
          <RolesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}