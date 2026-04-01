"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Check,
  X,
  Users,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Types based on database schema
interface Permission {
  id: number
  clave: string
  nombre: string
  descripcion: string
  modulo: string
}

interface Role {
  id: number
  nombre: string
  descripcion: string | null
  esAdministrador: boolean
  activo: boolean
  userCount: number
  permisos: number[]
}

// Mock data based on the SQL schema
const permissions: Permission[] = [
  { id: 1, clave: "ventas.crear", nombre: "Crear venta", descripcion: "Abrir una nueva orden de venta", modulo: "ventas" },
  { id: 2, clave: "ventas.ver", nombre: "Ver ventas", descripcion: "Consultar historial y detalle de ventas", modulo: "ventas" },
  { id: 3, clave: "ventas.cerrar", nombre: "Cobrar / cerrar orden", descripcion: "Marcar una orden como pagada y cerrarla", modulo: "ventas" },
  { id: 4, clave: "ventas.agregar_producto", nombre: "Agregar producto a orden", descripcion: "Añadir productos a una orden ABIERTA", modulo: "ventas" },
  { id: 5, clave: "ventas.enviar_cocina", nombre: "Enviar orden a cocina", descripcion: "Notificar al cocinero los productos de una orden", modulo: "ventas" },
  { id: 6, clave: "productos.ver", nombre: "Ver productos", descripcion: "Consultar el catálogo de productos", modulo: "productos" },
  { id: 7, clave: "productos.crear", nombre: "Crear producto", descripcion: "Agregar nuevos productos al catálogo", modulo: "productos" },
  { id: 8, clave: "productos.editar", nombre: "Editar producto", descripcion: "Modificar nombre, precio o categoría de un producto", modulo: "productos" },
  { id: 9, clave: "productos.desactivar", nombre: "Desactivar producto", descripcion: "Ocultar un producto del menú", modulo: "productos" },
  { id: 10, clave: "categorias.gestionar", nombre: "Gestionar categorías", descripcion: "Crear, editar y desactivar categorías", modulo: "productos" },
  { id: 11, clave: "usuarios.gestionar", nombre: "Gestionar usuarios", descripcion: "Crear, editar y desactivar usuarios del negocio", modulo: "usuarios" },
  { id: 12, clave: "roles.gestionar", nombre: "Gestionar roles", descripcion: "Crear roles y asignar permisos dentro del negocio", modulo: "usuarios" },
  { id: 13, clave: "configuracion.editar", nombre: "Editar configuración", descripcion: "Modificar parámetros del negocio y horarios WhatsApp", modulo: "configuracion" },
  { id: 14, clave: "reportes.ver", nombre: "Ver reportes", descripcion: "Acceder a reportes de ventas y estadísticas", modulo: "reportes" },
]

const roles: Role[] = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso completo a todas las funciones del sistema",
    esAdministrador: true,
    activo: true,
    userCount: 1,
    permisos: permissions.map((p) => p.id),
  },
  {
    id: 2,
    nombre: "Vendedor",
    descripcion: "Gestión de ventas y atención al cliente",
    esAdministrador: false,
    activo: true,
    userCount: 2,
    permisos: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 3,
    nombre: "Cocinero",
    descripcion: "Visualización y gestión de órdenes en cocina",
    esAdministrador: false,
    activo: true,
    userCount: 1,
    permisos: [2, 6],
  },
  {
    id: 4,
    nombre: "Supervisor",
    descripcion: "Supervisión de ventas y reportes",
    esAdministrador: false,
    activo: true,
    userCount: 0,
    permisos: [1, 2, 3, 4, 5, 6, 7, 8, 14],
  },
]

const moduleLabels: Record<string, string> = {
  ventas: "Ventas",
  productos: "Productos",
  usuarios: "Usuarios",
  configuracion: "Configuración",
  reportes: "Reportes",
}

const moduleColors: Record<string, string> = {
  ventas: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  productos: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  usuarios: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  configuracion: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  reportes: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
}

export function RolesView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  const filteredRoles = roles.filter((role) =>
    role.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.modulo]) acc[perm.modulo] = []
    acc[perm.modulo].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permisos)
    setIsAdmin(role.esAdministrador)
    setIsEditPermissionsOpen(true)
  }

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    )
  }

  const toggleAllInModule = (modulo: string, checked: boolean) => {
    const modulePermIds = permissionsByModule[modulo].map((p) => p.id)
    if (checked) {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermIds])])
    } else {
      setSelectedPermissions((prev) =>
        prev.filter((id) => !modulePermIds.includes(id))
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Roles y Permisos</h2>
          <p className="text-sm text-muted-foreground">
            Configura los roles y permisos de acceso al sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear nuevo rol</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nombre del rol</Label>
                <Input
                  id="roleName"
                  placeholder="Ej: Supervisor"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Descripción</Label>
                <Input
                  id="roleDesc"
                  placeholder="Descripción del rol..."
                  className="rounded-xl border-2"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Rol Administrador</p>
                    <p className="text-sm text-muted-foreground">
                      Acceso total a todas las funciones
                    </p>
                  </div>
                </div>
                <Switch />
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
                  Crear rol
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-2 pl-12"
        />
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className={cn(
              "group relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg",
              role.esAdministrador && "border-primary/30 bg-primary/5"
            )}
          >
            {/* Actions */}
            <div className="absolute right-3 top-3">
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
                  <DropdownMenuItem onClick={() => handleEditPermissions(role)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Editar permisos
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar rol
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={role.userCount > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desactivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Icon */}
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
                role.esAdministrador
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {role.esAdministrador ? (
                <ShieldCheck className="h-7 w-7" />
              ) : (
                <Shield className="h-7 w-7" />
              )}
            </div>

            {/* Info */}
            <h3 className="font-semibold text-foreground">{role.nombre}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {role.descripcion || "Sin descripción"}
            </p>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {role.userCount} usuarios
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                {role.esAdministrador ? "Todos" : role.permisos.length} permisos
              </div>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {role.esAdministrador ? (
                <Badge
                  variant="outline"
                  className="rounded-lg border-2 border-primary/30 bg-primary/10 text-primary"
                >
                  Acceso completo
                </Badge>
              ) : (
                <>
                  {[...new Set(role.permisos.map((pid) => permissions.find((p) => p.id === pid)?.modulo))].slice(0, 3).map((modulo) => modulo && (
                    <Badge
                      key={modulo}
                      variant="outline"
                      className={cn("rounded-lg border-2", moduleColors[modulo])}
                    >
                      {moduleLabels[modulo]}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span
                className={
                  role.activo ? "text-primary" : "text-muted-foreground"
                }
              >
                {role.activo ? "Activo" : "Inactivo"}
              </span>
              <Switch checked={role.activo} />
            </div>
          </div>
        ))}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
        <DialogContent className="rounded-2xl border-2 sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de {selectedRole?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Admin toggle */}
            <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Rol Administrador</p>
                  <p className="text-sm text-muted-foreground">
                    Otorga acceso total sin necesidad de permisos individuales
                  </p>
                </div>
              </div>
              <Switch
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
            </div>

            {!isAdmin && (
              <ScrollArea className="h-96 rounded-xl border-2 border-border p-4">
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([modulo, perms]) => {
                    const allSelected = perms.every((p) =>
                      selectedPermissions.includes(p.id)
                    )
                    const someSelected =
                      perms.some((p) => selectedPermissions.includes(p.id)) &&
                      !allSelected

                    return (
                      <div key={modulo} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            className="data-[state=indeterminate]:bg-primary/50"
                            data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                            onCheckedChange={(checked) =>
                              toggleAllInModule(modulo, checked as boolean)
                            }
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg border-2 font-medium",
                              moduleColors[modulo]
                            )}
                          >
                            {moduleLabels[modulo]}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {perm.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {perm.descripcion}
                                </p>
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

            {/* Summary */}
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm">
                <span className="font-medium">
                  {isAdmin ? "Todos los permisos" : selectedPermissions.length}
                </span>{" "}
                permisos seleccionados
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-2"
                onClick={() => setIsEditPermissionsOpen(false)}
              >
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl gap-2">
                <Check className="h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
