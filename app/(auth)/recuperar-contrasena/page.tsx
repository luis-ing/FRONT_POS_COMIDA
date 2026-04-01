"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Store, Moon, Sun, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useTheme } from "next-themes"

export default function RecuperarContrasenaPage() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [correo, setCorreo] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!correo.trim()) {
      setError("Por favor ingresa tu correo electrónico")
      return
    }

    setIsLoading(true)
    // Simular envío de correo
    setTimeout(() => {
      setIsLoading(false)
      setIsEmailSent(true)
    }, 1500)
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
            {isEmailSent ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Store className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isEmailSent ? "Correo enviado" : "Recuperar contraseña"}
          </CardTitle>
          <CardDescription className="text-base">
            {isEmailSent
              ? "Revisa tu bandeja de entrada"
              : "Te enviaremos un enlace para restablecer tu contraseña"}
          </CardDescription>
        </CardHeader>

        {isEmailSent ? (
          <CardContent className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Hemos enviado un correo a:
              </p>
              <p className="font-semibold text-foreground">{correo}</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Si no ves el correo en tu bandeja de entrada, revisa la carpeta de spam.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border-2 border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Correo electrónico
                  </FieldLabel>
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="h-12 rounded-xl border-2 focus:border-primary"
                    autoComplete="email"
                  />
                </Field>
              </FieldGroup>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </CardFooter>
          </form>
        )}

        <CardFooter className={isEmailSent ? "pt-2" : "pt-0"}>
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Sistema de Punto de Venta para Tiendas de Comida
      </p>
    </div>
  )
}
