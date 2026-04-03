"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, MoreHorizontal, Edit2, Trash2, Shield, ShieldCheck, Check, Users, Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import {
  getPermisos, getRoles, createRol, updatePermisosRol, desactivarRol,
} from "@/services/rol_service"
import type { PermisoResponse, RolResponse } from "@/types/schemas"

// ── Colores por módulo ────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  ventas:        "Ventas",
  productos:     "Productos",
  usuarios:      "Usuarios",
  configuracion: "Configuración",
  reportes:      "Reportes",
}

const MODULE_COLORS: Record<string, string> = {
  ventas:        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  productos:     "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  usuarios:      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  configuracion: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  reportes:      "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
}

const EMPTY_FORM = { nombre: "", descripcion: "", esAdministrador: false }

// ── Componente ────────────────────────────────────────────────────────────────

export function RolesView() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [roles,    setRoles]    = useState<RolResponse[]>([])
  const [permisos, setPermisos] = useState<PermisoResponse[]>([])
  const [loading,  setLoading]  = useState(true)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [searchQuery,         setSearchQuery]         = useState("")
  const [isCreateOpen,        setIsCreateOpen]        = useState(false)
  const [isEditPermsOpen,     setIsEditPermsOpen]     = useState(false)
  const [selectedRole,        setSelectedRole]        = useState<RolResponse | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [isAdmin,             setIsAdmin]             = useState(false)
  const [form,                setForm]                = useState(EMPTY_FORM)
  const [submitting,          setSubmitting]          = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([getRoles(), getPermisos()])
      setRoles(r)
      setPermisos(p)
    } catch {
      toast.error("Error al cargar roles y permisos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Agrupar permisos por módulo ───────────────────────────────────────────
  const permsByModule = permisos.reduce<Record<string, PermisoResponse[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = []
    acc[p.modulo].push(p)
    return acc
  }, {})

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = roles.filter(r =>
    r.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Crear rol ─────────────────────────────────────────────────────────────
  const handleCreateRol = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }
    setSubmitting(true)
    try {
      const created = await createRol({
        nombre:          form.nombre,
        descripcion:     form.descripcion || undefined,
        esAdministrador: form.esAdministrador,
        permisos:        [],
      })
      setRoles(prev => [...prev, created])
      toast.success("Rol creado exitosamente")
      setIsCreateOpen(false)
      setForm(EMPTY_FORM)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al crear el rol")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Editar permisos ───────────────────────────────────────────────────────
  const openEditPerms = (rol: RolResponse) => {
    setSelectedRole(rol)
    setSelectedPermissions(rol.permisos.map(p => p.id))
    setIsAdmin(rol.esAdministrador)
    setIsEditPermsOpen(true)
  }

  const handleSavePermisos = async () => {
    if (!selectedRole) return
    setSubmitting(true)
    try {
      const updated = await updatePermisosRol(selectedRole.id, {
        permisos: selectedPermissions,
      })
      setRoles(prev => prev.map(r => r.id === updated.id ? updated : r))
      toast.success("Permisos actualizados")
      setIsEditPermsOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al guardar permisos")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Desactivar rol ────────────────────────────────────────────────────────
  const handleDesactivar = async (rol: RolResponse) => {
    try {
      await desactivarRol(rol.id)
      setRoles(prev => prev.map(r => r.id === rol.id ? { ...r, activo: false } : r))
      toast.success(`Rol "${rol.nombre}" desactivado`)
    } catch (err: any) {
      // 409 cuando hay usuarios activos con ese rol
      toast.error(err?.response?.data?.detail ?? "Error al desactivar el rol")
    }
  }

  // ── Helpers de permisos ───────────────────────────────────────────────────
  const togglePermission = (id: number) =>
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const toggleModule = (modulo: string, checked: boolean) => {
    const ids = permsByModule[modulo].map(p => p.id)
    setSelectedPermissions(prev =>
      checked
        ? [...new Set([...prev, ...ids])]
        : prev.filter(id => !ids.includes(id))
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Roles y Permisos</h2>
          <p className="text-sm text-muted-foreground">Configura los roles y permisos de acceso al sistema</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2" onClick={() => setForm(EMPTY_FORM)}>
              <Plus className="h-4 w-4" /> Nuevo rol
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear nuevo rol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del rol *</Label>
                <Input
                  placeholder="Ej: Supervisor"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  placeholder="Descripción del rol..."
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Rol Administrador</p>
                    <p className="text-sm text-muted-foreground">Acceso total a todas las funciones</p>
                  </div>
                </div>
                <Switch
                  checked={form.esAdministrador}
                  onCheckedChange={v => setForm(f => ({ ...f, esAdministrador: v }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleCreateRol} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear rol
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar roles..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-2 pl-12"
        />
      </div>

      {/* Grid de roles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(rol => (
          <div
            key={rol.id}
            className={cn(
              "group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg",
              rol.esAdministrador && "border-primary/30 bg-primary/5"
            )}
          >
            {/* Menú acciones */}
            <div className="absolute right-3 top-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => openEditPerms(rol)}>
                    <Shield className="mr-2 h-4 w-4" /> Editar permisos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={!rol.activo || rol.esAdministrador}
                    onClick={() => handleDesactivar(rol)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Desactivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Icono */}
            <div className={cn(
              "mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
              rol.esAdministrador ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {rol.esAdministrador
                ? <ShieldCheck className="h-7 w-7" />
                : <Shield className="h-7 w-7" />}
            </div>

            <h3 className="font-semibold text-foreground">{rol.nombre}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {rol.descripcion || "Sin descripción"}
            </p>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {rol.esAdministrador ? "Todos" : rol.permisos.length} permisos
              </div>
            </div>

            {/* Badges de módulos */}
            <div className="mt-4 flex flex-wrap gap-2">
              {rol.esAdministrador ? (
                <Badge variant="outline" className="rounded-lg border-2 border-primary/30 bg-primary/10 text-primary">
                  Acceso completo
                </Badge>
              ) : (
                [...new Set(rol.permisos.map(p => p.modulo))].slice(0, 3).map(mod => (
                  <Badge
                    key={mod}
                    variant="outline"
                    className={cn("rounded-lg border-2", MODULE_COLORS[mod] ?? "")}
                  >
                    {MODULE_LABELS[mod] ?? mod}
                  </Badge>
                ))
              )}
            </div>

            {/* Estado */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className={rol.activo ? "text-primary" : "text-muted-foreground"}>
                {rol.activo ? "Activo" : "Inactivo"}
              </span>
              <Badge variant={rol.activo ? "default" : "outline"} className="rounded-lg">
                {rol.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog: editar permisos */}
      <Dialog open={isEditPermsOpen} onOpenChange={setIsEditPermsOpen}>
        <DialogContent className="rounded-2xl border-2 sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de {selectedRole?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle admin */}
            <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Rol Administrador</p>
                  <p className="text-sm text-muted-foreground">Otorga acceso total sin permisos individuales</p>
                </div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>

            {!isAdmin && (
              <ScrollArea className="h-96 rounded-xl border-2 border-border p-4">
                <div className="space-y-6">
                  {Object.entries(permsByModule).map(([modulo, perms]) => {
                    const allSelected = perms.every(p => selectedPermissions.includes(p.id))
                    const someSelected = perms.some(p => selectedPermissions.includes(p.id)) && !allSelected
                    return (
                      <div key={modulo} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                            onCheckedChange={v => toggleModule(modulo, v as boolean)}
                          />
                          <Badge
                            variant="outline"
                            className={cn("rounded-lg border-2 font-medium", MODULE_COLORS[modulo] ?? "")}
                          >
                            {MODULE_LABELS[modulo] ?? modulo}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-2">
                          {perms.map(perm => (
                            <label
                              key={perm.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{perm.nombre}</p>
                                <p className="text-xs text-muted-foreground">{perm.descripcion}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm">
                <span className="font-medium">
                  {isAdmin ? "Todos los permisos" : selectedPermissions.length}
                </span>{" "}
                permisos seleccionados
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={() => setIsEditPermsOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl gap-2" onClick={handleSavePermisos} disabled={submitting}>
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}