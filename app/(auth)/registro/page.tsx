"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Eye, EyeOff, Store, Moon, Sun, Building2, User, Mail, Phone, MapPin, Lock, CheckCircle2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type Step = "negocio" | "usuario" | "confirmacion"

export default function RegistroPage() {
  const { theme, setTheme } = useTheme()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("negocio")
  const [error, setError] = useState("")

  const [negocioData, setNegocioData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  })

  const [usuarioData, setUsuarioData] = useState({
    nombre: "",
    apellidos: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
  })

  const steps = [
    { id: "negocio", label: "Datos del Negocio", icon: Building2 },
    { id: "usuario", label: "Usuario Administrador", icon: User },
    { id: "confirmacion", label: "Confirmación", icon: CheckCircle2 },
  ]

  const validateNegocio = () => {
    if (!negocioData.nombre.trim()) {
      setError("El nombre del negocio es requerido")
      return false
    }
    setError("")
    return true
  }

  const validateUsuario = () => {
    if (!usuarioData.nombre.trim()) {
      setError("El nombre es requerido")
      return false
    }
    if (!usuarioData.correo.trim()) {
      setError("El correo es requerido")
      return false
    }
    if (!usuarioData.contrasena) {
      setError("La contraseña es requerida")
      return false
    }
    if (usuarioData.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    if (usuarioData.contrasena !== usuarioData.confirmarContrasena) {
      setError("Las contraseñas no coinciden")
      return false
    }
    setError("")
    return true
  }

  const handleNext = () => {
    if (currentStep === "negocio") {
      if (validateNegocio()) {
        setCurrentStep("usuario")
      }
    } else if (currentStep === "usuario") {
      if (validateUsuario()) {
        setCurrentStep("confirmacion")
      }
    }
  }

  const handleBack = () => {
    setError("")
    if (currentStep === "usuario") {
      setCurrentStep("negocio")
    } else if (currentStep === "confirmacion") {
      setCurrentStep("usuario")
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError("")

    try {
      const success = await register({
        negocio: {
          nombre: negocioData.nombre,
          telefono: negocioData.telefono || undefined,
          direccion: negocioData.direccion || undefined,
        },
        usuario: {
          nombre: usuarioData.nombre,
          apellidos: usuarioData.apellidos,
          correo: usuarioData.correo,
          contrasena: usuarioData.contrasena,
        },
      })

      if (!success) {
        setError("Error al registrar. Por favor intenta de nuevo.")
      }
    } catch {
      setError("Error al registrar. Por favor intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
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
          <CardTitle className="text-2xl font-bold">Registrar Negocio</CardTitle>
          <CardDescription className="text-base">
            Crea tu cuenta y comienza a gestionar tu tienda
          </CardDescription>
        </CardHeader>

        {/* Steps indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = 
                (step.id === "negocio" && (currentStep === "usuario" || currentStep === "confirmacion")) ||
                (step.id === "usuario" && currentStep === "confirmacion")
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                        isActive && "bg-primary border-primary text-primary-foreground",
                        isCompleted && "bg-primary/20 border-primary text-primary",
                        !isActive && !isCompleted && "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-1.5 font-medium hidden sm:block",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-12 sm:w-20 h-0.5 mx-2",
                      isCompleted ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <CardContent className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border-2 border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Datos del Negocio */}
          {currentStep === "negocio" && (
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nombre del Negocio *
                </FieldLabel>
                <Input
                  placeholder="Ej: Tacos El Patrón"
                  value={negocioData.nombre}
                  onChange={(e) => setNegocioData({ ...negocioData, nombre: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono (opcional)
                </FieldLabel>
                <Input
                  type="tel"
                  placeholder="Ej: +52 55 1234 5678"
                  value={negocioData.telefono}
                  onChange={(e) => setNegocioData({ ...negocioData, telefono: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección (opcional)
                </FieldLabel>
                <Input
                  placeholder="Ej: Av. Principal #123, Col. Centro"
                  value={negocioData.direccion}
                  onChange={(e) => setNegocioData({ ...negocioData, direccion: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </Field>
            </FieldGroup>
          )}

          {/* Step 2: Usuario Administrador */}
          {currentStep === "usuario" && (
            <FieldGroup className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nombre *
                  </FieldLabel>
                  <Input
                    placeholder="Tu nombre"
                    value={usuarioData.nombre}
                    onChange={(e) => setUsuarioData({ ...usuarioData, nombre: e.target.value })}
                    className="h-12 rounded-xl border-2 focus:border-primary"
                  />
                </Field>

                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input
                    placeholder="Tus apellidos"
                    value={usuarioData.apellidos}
                    onChange={(e) => setUsuarioData({ ...usuarioData, apellidos: e.target.value })}
                    className="h-12 rounded-xl border-2 focus:border-primary"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo electrónico *
                </FieldLabel>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={usuarioData.correo}
                  onChange={(e) => setUsuarioData({ ...usuarioData, correo: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                  autoComplete="email"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Contraseña *
                </FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={usuarioData.contrasena}
                    onChange={(e) => setUsuarioData({ ...usuarioData, contrasena: e.target.value })}
                    className="h-12 rounded-xl border-2 focus:border-primary pr-12"
                    autoComplete="new-password"
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

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar contraseña *
                </FieldLabel>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={usuarioData.confirmarContrasena}
                    onChange={(e) => setUsuarioData({ ...usuarioData, confirmarContrasena: e.target.value })}
                    className="h-12 rounded-xl border-2 focus:border-primary pr-12"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          )}

          {/* Step 3: Confirmación */}
          {currentStep === "confirmacion" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border-2 border-border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Datos del Negocio
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">{negocioData.nombre}</span>
                  </div>
                  {negocioData.telefono && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{negocioData.telefono}</span>
                    </div>
                  )}
                  {negocioData.direccion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dirección:</span>
                      <span className="font-medium">{negocioData.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border-2 border-border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Usuario Administrador
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">
                      {usuarioData.nombre} {usuarioData.apellidos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correo:</span>
                    <span className="font-medium">{usuarioData.correo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    <span className="font-medium text-primary">Administrador</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                <p className="text-sm text-center text-muted-foreground">
                  Al registrarte, se creará automáticamente un rol de{" "}
                  <strong className="text-foreground">Administrador</strong> con todos los permisos 
                  del sistema para tu negocio.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <div className="flex gap-3 w-full">
            {currentStep !== "negocio" && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl text-base font-semibold border-2"
                onClick={handleBack}
                disabled={isLoading}
              >
                Anterior
              </Button>
            )}
            
            {currentStep !== "confirmacion" ? (
              <Button
                type="button"
                className="flex-1 h-12 rounded-xl text-base font-semibold"
                onClick={handleNext}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 h-12 rounded-xl text-base font-semibold"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Registrando...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Sistema de Punto de Venta para Tiendas de Comida
      </p>
    </div>
  )
}
