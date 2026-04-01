"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  ClipboardList,
  ChefHat,
  Users,
  UserCog,
  Settings,
  Store,
  Moon,
  Sun,
  Calculator,
  Package,
  FileText,
  LogOut,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  {
    title: "Catálogo",
    href: "/",
    icon: LayoutGrid,
  },
  {
    title: "Órdenes Abiertas",
    href: "/ordenes-abiertas",
    icon: FileText,
  },
  {
    title: "Órdenes",
    href: "/ordenes",
    icon: ClipboardList,
  },
  {
    title: "Cocina",
    href: "/cocina",
    icon: ChefHat,
  },
  {
    title: "Productos",
    href: "/productos",
    icon: Package,
  },
  {
    title: "Calculadora",
    href: "/calculadora",
    icon: Calculator,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: UserCog,
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, negocio, logout } = useAuth()

  const userInitials = user
    ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase()
    : "?"

  return (
    <aside className="flex h-screen w-20 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-center border-b border-border">
        <Link href="/" className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.title}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      <div className="flex flex-col items-center gap-2 border-t border-border py-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 w-12 rounded-xl p-0"
              >
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {user.nombres} {user.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.correo}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {user.rol_nombre}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Store className="h-3 w-3" />
                  {negocio?.nombre}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
