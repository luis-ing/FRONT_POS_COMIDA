"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

// Types based on database schema
export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  id_rol: number
  rol_nombre: string
  id_negocio: number
  negocio_nombre: string
  estado: "activo" | "inactivo"
}

export interface Negocio {
  id: number
  nombre: string
  telefono: string
  direccion: string
}

interface RegisterData {
  negocio: {
    nombre: string
    telefono?: string
    direccion?: string
  }
  usuario: {
    nombres: string
    apellidos: string
    correo: string
    contrasena: string
  }
}

interface AuthContextType {
  user: Usuario | null
  negocio: Negocio | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (correo: string, contrasena: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  hasPermission: (permiso: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock data for demonstration - replace with actual API calls
const mockUsers: (Usuario & { contrasena: string })[] = [
  {
    id: 1,
    nombres: "Admin",
    apellidos: "Principal",
    correo: "admin@tienda.com",
    contrasena: "admin123",
    telefono: "555-1234",
    id_rol: 1,
    rol_nombre: "Administrador",
    id_negocio: 1,
    negocio_nombre: "Mi Tienda de Comida",
    estado: "activo",
  },
  {
    id: 2,
    nombres: "Juan",
    apellidos: "Vendedor",
    correo: "vendedor@tienda.com",
    contrasena: "vendedor123",
    telefono: "555-5678",
    id_rol: 2,
    rol_nombre: "Vendedor",
    id_negocio: 1,
    negocio_nombre: "Mi Tienda de Comida",
    estado: "activo",
  },
  {
    id: 3,
    nombres: "Pedro",
    apellidos: "Cocinero",
    correo: "cocinero@tienda.com",
    contrasena: "cocinero123",
    telefono: "555-9012",
    id_rol: 3,
    rol_nombre: "Cocinero",
    id_negocio: 1,
    negocio_nombre: "Mi Tienda de Comida",
    estado: "activo",
  },
]

const mockNegocio: Negocio = {
  id: 1,
  nombre: "Mi Tienda de Comida",
  telefono: "555-0000",
  direccion: "Calle Principal #123",
}

// Mock permissions by role
const mockPermisosPorRol: Record<number, string[]> = {
  1: ["*"], // Admin has all permissions
  2: ["ventas.crear", "ventas.ver", "productos.ver", "clientes.ver", "clientes.crear"], // Vendedor
  3: ["cocina.ver", "cocina.actualizar"], // Cocinero
}

const PUBLIC_ROUTES = ["/login", "/registro", "/recuperar-contrasena"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem("tienda_comida_user")
        const storedNegocio = localStorage.getItem("tienda_comida_negocio")
        
        if (storedUser && storedNegocio) {
          setUser(JSON.parse(storedUser))
          setNegocio(JSON.parse(storedNegocio))
        }
      } catch {
        // Invalid session data, clear it
        localStorage.removeItem("tienda_comida_user")
        localStorage.removeItem("tienda_comida_negocio")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

    if (!user && !isPublicRoute) {
      router.push("/login")
    } else if (user && isPublicRoute) {
      router.push("/")
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(async (correo: string, contrasena: string): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      // Mock authentication - in demo mode, accept any credentials
      // In production, this would validate against the API
      let foundUser = mockUsers.find(
        u => u.correo.toLowerCase() === correo.toLowerCase() && u.contrasena === contrasena && u.estado === "activo"
      )

      // Demo mode: if no user found, create a temporary session with the provided email
      if (!foundUser) {
        foundUser = {
          ...mockUsers[0],
          correo: correo,
          contrasena: contrasena,
        }
      }

      // Remove password from user object
      const { contrasena: _, ...userWithoutPassword } = foundUser

      setUser(userWithoutPassword)
      setNegocio(mockNegocio)

      // Store session
      localStorage.setItem("tienda_comida_user", JSON.stringify(userWithoutPassword))
      localStorage.setItem("tienda_comida_negocio", JSON.stringify(mockNegocio))

      setIsLoading(false)
      return true
    } catch {
      setIsLoading(false)
      return false
    }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    try {
      // Create new negocio
      const newNegocio: Negocio = {
        id: Date.now(),
        nombre: data.negocio.nombre,
        telefono: data.negocio.telefono || "",
        direccion: data.negocio.direccion || "",
      }

      // Create new user as admin
      const newUser: Usuario = {
        id: Date.now(),
        nombres: data.usuario.nombres,
        apellidos: data.usuario.apellidos,
        correo: data.usuario.correo,
        telefono: null,
        id_rol: 1, // Admin role
        rol_nombre: "Administrador",
        id_negocio: newNegocio.id,
        negocio_nombre: newNegocio.nombre,
        estado: "activo",
      }

      setUser(newUser)
      setNegocio(newNegocio)

      // Store session
      localStorage.setItem("tienda_comida_user", JSON.stringify(newUser))
      localStorage.setItem("tienda_comida_negocio", JSON.stringify(newNegocio))

      setIsLoading(false)
      return true
    } catch {
      setIsLoading(false)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setNegocio(null)
    localStorage.removeItem("tienda_comida_user")
    localStorage.removeItem("tienda_comida_negocio")
    router.push("/login")
  }, [router])

  const hasPermission = useCallback((permiso: string): boolean => {
    if (!user) return false

    const permisos = mockPermisosPorRol[user.id_rol] || []
    
    // Admin has all permissions
    if (permisos.includes("*")) return true
    
    // Check exact permission or wildcard
    return permisos.some(p => {
      if (p === permiso) return true
      // Check module wildcard (e.g., "ventas.*" matches "ventas.crear")
      const [module] = permiso.split(".")
      return p === `${module}.*`
    })
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        negocio,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
