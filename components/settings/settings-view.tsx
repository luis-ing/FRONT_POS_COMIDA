"use client"

import { useState } from "react"
import { Save, Store, Clock, MessageSquare, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

const daysOfWeek = [
  { id: 1, name: "Lunes", short: "Lun" },
  { id: 2, name: "Martes", short: "Mar" },
  { id: 3, name: "Miércoles", short: "Mié" },
  { id: 4, name: "Jueves", short: "Jue" },
  { id: 5, name: "Viernes", short: "Vie" },
  { id: 6, name: "Sábado", short: "Sáb" },
  { id: 7, name: "Domingo", short: "Dom" },
]

const paymentMethods = [
  { id: 1, name: "Efectivo", active: true },
  { id: 2, name: "Tarjeta de crédito", active: true },
  { id: 3, name: "Tarjeta de débito", active: true },
  { id: 4, name: "Transferencia", active: false },
]

export function SettingsView() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6])

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort()
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Configura los parámetros del negocio
        </p>
      </div>

      <Tabs defaultValue="general" className="flex-1">
        <TabsList className="mb-6 h-12 rounded-xl border-2 border-border bg-card p-1">
          <TabsTrigger
            value="general"
            className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Store className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="horarios"
            className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Clock className="mr-2 h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger
            value="pagos"
            className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Información del negocio
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input
                  id="businessName"
                  defaultValue="Tienda Comida"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  defaultValue="+52 55 1234 5678"
                  className="rounded-xl border-2"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  defaultValue="Av. Principal 123, Col. Centro, CDMX"
                  className="rounded-xl border-2"
                />
              </div>
            </div>
            <Button className="mt-6 rounded-xl gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Pedidos por WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Activa o desactiva los pedidos por WhatsApp
                </p>
              </div>
              <Switch
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensaje de bienvenida</Label>
                <Textarea
                  id="welcomeMessage"
                  defaultValue="¡Hola! Bienvenido a Tienda Comida. ¿En qué podemos ayudarte hoy?"
                  className="min-h-[100px] rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closedMessage">
                  Mensaje fuera de horario
                </Label>
                <Textarea
                  id="closedMessage"
                  defaultValue="Lo sentimos, en este momento estamos cerrados. Nuestro horario de atención es de 9:00 a 22:00."
                  className="min-h-[100px] rounded-xl border-2"
                />
              </div>
            </div>

            <Button className="mt-6 rounded-xl gap-2">
              <Save className="h-4 w-4" />
              Guardar configuración
            </Button>
          </div>
        </TabsContent>

        {/* Horarios Tab */}
        <TabsContent value="horarios" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Días de atención</h3>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`flex h-12 w-14 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                    selectedDays.includes(day.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-medium">{day.short}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Horarios por día</h3>
            <div className="space-y-4">
              {daysOfWeek
                .filter((day) => selectedDays.includes(day.id))
                .map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center gap-4 rounded-xl border-2 border-border p-4"
                  >
                    <span className="w-24 font-medium">{day.name}</span>
                    <Input
                      type="time"
                      defaultValue="09:00"
                      className="w-32 rounded-xl border-2"
                    />
                    <span className="text-muted-foreground">a</span>
                    <Input
                      type="time"
                      defaultValue="22:00"
                      className="w-32 rounded-xl border-2"
                    />
                  </div>
                ))}
            </div>
            <Button className="mt-6 rounded-xl gap-2">
              <Save className="h-4 w-4" />
              Guardar horarios
            </Button>
          </div>
        </TabsContent>

        {/* Pagos Tab */}
        <TabsContent value="pagos" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Métodos de pago</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-xl border-2 border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <Switch defaultChecked={method.active} />
                </div>
              ))}
            </div>
            <Button className="mt-6 rounded-xl gap-2">
              <Save className="h-4 w-4" />
              Guardar configuración
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
