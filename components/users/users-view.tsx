"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Shield,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RolesView } from "./roles-view"

const users = [
  {
    id: 1,
    name: "Admin Principal",
    email: "admin@tiendacomida.com",
    role: "Administrador",
    active: true,
    createdAt: "2025-01-15",
  },
  {
    id: 2,
    name: "María González",
    email: "maria@tiendacomida.com",
    role: "Vendedor",
    active: true,
    createdAt: "2025-02-01",
  },
  {
    id: 3,
    name: "Carlos Ruiz",
    email: "carlos@tiendacomida.com",
    role: "Cocinero",
    active: true,
    createdAt: "2025-02-10",
  },
  {
    id: 4,
    name: "Ana Jiménez",
    email: "ana@tiendacomida.com",
    role: "Vendedor",
    active: false,
    createdAt: "2025-03-01",
  },
]

const roleColors: Record<string, string> = {
  Administrador: "bg-primary/10 text-primary border-primary/30",
  Vendedor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Cocinero: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  Supervisor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
}

export function UsersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
        <p className="text-muted-foreground">
          Gestiona los usuarios del sistema y sus permisos de acceso
        </p>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="w-fit rounded-xl border-2 border-border bg-muted/50 p-1">
          <TabsTrigger value="users" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Shield className="h-4 w-4" />
            Roles y Permisos
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="flex-1 flex flex-col mt-4">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-72 rounded-xl border-2 pl-12"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2">
                <DialogHeader>
                  <DialogTitle>Crear nuevo usuario</DialogTitle>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        placeholder="Nombre"
                        className="rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        placeholder="Apellidos"
                        className="rounded-xl border-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        <SelectItem value="cook">Cocinero</SelectItem>
                      </SelectContent>
                    </Select>
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
                      Crear usuario
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total usuarios</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Usuarios activos</p>
              <p className="text-2xl font-bold text-primary">
                {users.filter((u) => u.active).length}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Usuarios inactivos</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {users.filter((u) => !u.active).length}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Roles configurados</p>
              <p className="text-2xl font-bold text-foreground">4</p>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <TableHead className="font-semibold">Usuario</TableHead>
                  <TableHead className="font-semibold">Correo</TableHead>
                  <TableHead className="font-semibold">Rol</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Creado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border-2 border-border">
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-lg border-2 ${roleColors[user.role] || ""}`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={user.active} />
                        <span
                          className={
                            user.active ? "text-primary" : "text-muted-foreground"
                          }
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt}
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
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {user.active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="flex-1 mt-4">
          <RolesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
