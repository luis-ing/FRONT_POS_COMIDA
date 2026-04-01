"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Eye, EyeOff, Store, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const { theme, setTheme } = useTheme()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    correo: "",
    contrasena: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validación
    if (!formData.correo || !formData.contrasena) {
      setError("Por favor complete todos los campos")
      setIsLoading(false)
      return
    }

    try {
      const success = await login(formData.correo, formData.contrasena)
      if (!success) {
        setError("Correo o contraseña incorrectos")
      }
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Theme toggle */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl border-2"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </div>

      <Card className="border-2 rounded-2xl shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Tienda Comida</CardTitle>
          <CardDescription className="text-base">
            Ingresa a tu cuenta para continuar
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border-2 border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel>Correo electrónico</FieldLabel>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                  autoComplete="email"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Contraseña</FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    className="h-12 rounded-xl border-2 focus:border-primary pr-12"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>

            <div className="flex justify-end">
              <Link
                href="/recuperar-contrasena"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-primary font-medium hover:underline">
                Registrar negocio
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Sistema de Punto de Venta para Tiendas de Comida
      </p>
    </div>
  )
}
