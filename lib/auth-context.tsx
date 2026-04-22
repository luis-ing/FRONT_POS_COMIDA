"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { login as apiLogin, onboarding as apiOnboarding } from "@/services/auth_service"
import { disconnectSocket } from "@/services/socket_client"
import type { UsuarioResponse, NegocioResponse } from "@/types/schemas"

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface RegisterData {
  negocio: { nombre: string; telefono?: string; direccion?: string }
  usuario: { nombre: string; apellidos?: string; correo: string; contrasena: string }
}

interface AuthContextType {
  user: UsuarioResponse | null
  negocio: NegocioResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (correo: string, contrasena: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  hasPermission: (permiso: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ["/login", "/registro", "/recuperar-contrasena"]

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<UsuarioResponse | null>(null)
  const [negocio, setNegocio]     = useState<NegocioResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  // Restaura sesión desde localStorage al montar
  useEffect(() => {
    try {
      const storedUser    = localStorage.getItem("tienda_comida_user")
      const storedNegocio = localStorage.getItem("tienda_comida_negocio")
      if (storedUser && storedNegocio) {
        setUser(JSON.parse(storedUser))
        setNegocio(JSON.parse(storedNegocio))
      }
    } catch {
      localStorage.removeItem("tienda_comida_user")
      localStorage.removeItem("tienda_comida_negocio")
      localStorage.removeItem("tienda_comida_token")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Redirección basada en auth
  useEffect(() => {
    if (isLoading) return
    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
    if (!user && !isPublicRoute) router.push("/login")
    else if (user && isPublicRoute) router.push("/")
  }, [user, isLoading, pathname, router])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (correo: string, contrasena: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // apiLogin guarda el token en localStorage automáticamente (ver auth_service.ts)
      const res      = await apiLogin({ correo, contrasena })
      const userData = res.user
      console.log("[Auth] Login successful:", userData)

      setUser(userData)
      setNegocio(res.negocio)
      localStorage.setItem("tienda_comida_user",    JSON.stringify(userData))
      localStorage.setItem("tienda_comida_negocio", JSON.stringify(res.negocio))
      return true
    } catch (err) {
      console.error("[Auth] Login error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Registro ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      // apiOnboarding guarda el token en localStorage automáticamente
      const res = await apiOnboarding({
        negocio: data.negocio,
        usuario: {
          nombre:     data.usuario.nombre,
          apellidos:  data.usuario.apellidos,
          correo:     data.usuario.correo,
          contrasena: data.usuario.contrasena,
        },
      })

      // Construimos un usuario mínimo con los datos del registro
      const minimalUser: UsuarioResponse = {
        id:            res.usuario_id,
        nombre:        data.usuario.nombre,
        apellidos:     data.usuario.apellidos ?? null,
        correo:        data.usuario.correo,
        activo:        true,
        idNegocio:     res.negocio_id,
        fechaCreacion: new Date().toISOString(),
        rol:           null,
      }
      const negocioData: NegocioResponse = {
        id:            res.negocio_id,
        nombre:        data.negocio.nombre,
        telefono:      data.negocio.telefono ?? null,
        direccion:     data.negocio.direccion ?? null,
        rutaInicial:   null,
        activo:        true,
        fechaCreacion: new Date().toISOString(),
      }

      setUser(minimalUser)
      setNegocio(negocioData)
      localStorage.setItem("tienda_comida_user",    JSON.stringify(minimalUser))
      localStorage.setItem("tienda_comida_negocio", JSON.stringify(negocioData))
      return true
    } catch (err) {
      console.error("[Auth] Register error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    disconnectSocket()
    setUser(null)
    setNegocio(null)
    localStorage.removeItem("tienda_comida_token")
    localStorage.removeItem("tienda_comida_user")
    localStorage.removeItem("tienda_comida_negocio")
    router.push("/login")
  }, [router])

  // ── hasPermission ──────────────────────────────────────────────────────────
  // Los permisos reales los valida el backend en cada request.
  // En el frontend los usamos solo para mostrar/ocultar elementos UI.
  const hasPermission = useCallback((permiso: string): boolean => {
    if (!user) return false
    const rol = user.rol
    if (!rol) return false
    if (rol.esAdministrador) return true  // admin = acceso total
    return rol.permisos.some(p => p.clave === permiso)
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, negocio, isLoading, isAuthenticated: !!user, login, register, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}