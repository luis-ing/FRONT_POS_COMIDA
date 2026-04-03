"use client"

import { useState, useEffect } from "react"
import { Save, Store, Clock, MessageSquare, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import { getConfiguracion, updateConfiguracion } from "@/services/configuracion_service"
import { useAuth } from "@/lib/auth-context"
import type { ConfiguracionResponse } from "@/types/schemas"

// ── Días de la semana ─────────────────────────────────────────────────────────
const DAYS = [
  { id: "1", name: "Lunes",     short: "Lun" },
  { id: "2", name: "Martes",    short: "Mar" },
  { id: "3", name: "Miércoles", short: "Mié" },
  { id: "4", name: "Jueves",    short: "Jue" },
  { id: "5", name: "Viernes",   short: "Vie" },
  { id: "6", name: "Sábado",    short: "Sáb" },
  { id: "7", name: "Domingo",   short: "Dom" },
]

// ── Helpers para dias/horarios almacenados como string ────────────────────────
// El backend guarda diasAtencion como "1,2,3,4,5" y horariosAtencion como "09:00-22:00"
const parseDias = (raw: string | null): string[] =>
  raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : ["1", "2", "3", "4", "5"]

const parseHorario = (raw: string | null) => {
  if (!raw) return { desde: "09:00", hasta: "22:00" }
  const [desde, hasta] = raw.split("-")
  return { desde: desde ?? "09:00", hasta: hasta ?? "22:00" }
}

export function SettingsView() {
  const { negocio } = useAuth()

  // ── Estado de configuración ────────────────────────────────────────────────
  const [config,   setConfig]   = useState<ConfiguracionResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // ── Campos locales del form ────────────────────────────────────────────────
  const [pedidosActivos,       setPedidosActivos]       = useState(false)
  const [mensajeBienvenida,    setMensajeBienvenida]    = useState("")
  const [mensajeFueraHorario,  setMensajeFueraHorario]  = useState("")
  const [selectedDays,         setSelectedDays]         = useState<string[]>(["1","2","3","4","5"])
  const [horario,              setHorario]              = useState({ desde: "09:00", hasta: "22:00" })

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    getConfiguracion()
      .then(data => {
        setConfig(data)
        setPedidosActivos(data.pedidosOnlineActivos)
        setMensajeBienvenida(data.mensajeBienvenida ?? "")
        setMensajeFueraHorario(data.mensajeFueraHorario ?? "")
        setSelectedDays(parseDias(data.diasAtencion))
        setHorario(parseHorario(data.horariosAtencion))
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setLoading(false))
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleDay = (id: string) =>
    setSelectedDays(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id].sort()
    )

  // ── Guardar WhatsApp (switch + mensajes) ───────────────────────────────────
  const handleSaveWhatsapp = async () => {
    setSaving(true)
    try {
      const updated = await updateConfiguracion({
        pedidosOnlineActivos: pedidosActivos,
        mensajeBienvenida:    mensajeBienvenida || undefined,
        mensajeFueraHorario:  mensajeFueraHorario || undefined,
      })
      setConfig(updated)
      toast.success("Configuración de WhatsApp guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ── Guardar horarios ───────────────────────────────────────────────────────
  const handleSaveHorarios = async () => {
    setSaving(true)
    try {
      const updated = await updateConfiguracion({
        diasAtencion:     selectedDays.join(","),
        horariosAtencion: `${horario.desde}-${horario.hasta}`,
      })
      setConfig(updated)
      toast.success("Horarios guardados")
    } catch {
      toast.error("Error al guardar horarios")
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Configura los parámetros del negocio</p>
      </div>

      <Tabs defaultValue="general" className="flex-1">
        <TabsList className="mb-6 h-12 rounded-xl border-2 border-border bg-card p-1">
          <TabsTrigger value="general" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Store className="mr-2 h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="horarios" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="mr-2 h-4 w-4" /> Horarios
          </TabsTrigger>
        </TabsList>

        {/* ── GENERAL ── (datos del negocio — solo lectura por ahora, requiere endpoint propio) */}
        <TabsContent value="general" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Información del negocio</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del negocio</Label>
                <Input defaultValue={negocio?.nombre ?? ""} className="rounded-xl border-2" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input defaultValue={negocio?.telefono ?? ""} className="rounded-xl border-2" readOnly />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Dirección</Label>
                <Input defaultValue={negocio?.direccion ?? ""} className="rounded-xl border-2" readOnly />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Para actualizar los datos del negocio, usa el endpoint PATCH /negocio cuando esté disponible.
            </p>
          </div>
        </TabsContent>

        {/* ── WHATSAPP ── */}
        <TabsContent value="whatsapp" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Pedidos por WhatsApp</h3>
                <p className="text-sm text-muted-foreground">Activa o desactiva los pedidos por WhatsApp</p>
              </div>
              <Switch checked={pedidosActivos} onCheckedChange={setPedidosActivos} />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensaje de bienvenida</Label>
                <Textarea
                  value={mensajeBienvenida}
                  onChange={e => setMensajeBienvenida(e.target.value)}
                  placeholder="¡Hola! Bienvenido a..."
                  className="min-h-[100px] rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje fuera de horario</Label>
                <Textarea
                  value={mensajeFueraHorario}
                  onChange={e => setMensajeFueraHorario(e.target.value)}
                  placeholder="Lo sentimos, en este momento estamos cerrados..."
                  className="min-h-[100px] rounded-xl border-2"
                />
              </div>
            </div>

            <Button className="mt-6 rounded-xl gap-2" onClick={handleSaveWhatsapp} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar configuración
            </Button>
          </div>
        </TabsContent>

        {/* ── HORARIOS ── */}
        <TabsContent value="horarios" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Días de atención</h3>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
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
            <h3 className="mb-4 text-lg font-semibold">Horario general</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Este horario aplica a todos los días seleccionados.
            </p>
            <div className="flex items-center gap-4 rounded-xl border-2 border-border p-4">
              <Input
                type="time"
                value={horario.desde}
                onChange={e => setHorario(h => ({ ...h, desde: e.target.value }))}
                className="w-32 rounded-xl border-2"
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="time"
                value={horario.hasta}
                onChange={e => setHorario(h => ({ ...h, hasta: e.target.value }))}
                className="w-32 rounded-xl border-2"
              />
            </div>

            <Button className="mt-6 rounded-xl gap-2" onClick={handleSaveHorarios} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar horarios
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}