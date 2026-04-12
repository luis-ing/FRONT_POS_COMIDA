import { io, Socket } from "socket.io-client";
import type { VentaResponse } from "@/types/schemas";

// ─── Tipos de eventos ─────────────────────────────────────────────────────────

interface ServerToClientEvents {
  nueva_orden: (venta: VentaResponse) => void;
  orden_actualizada: (venta: VentaResponse) => void;
  /** * CORRECCIÓN: El backend solo envía el ID de la venta, no el objeto completo
   */
  orden_lista: (data: { venta_id: number }) => void; 
}

interface ClientToServerEvents {
  // Ya no es necesario si lo enviamos en el auth de la conexión
  join_negocio: (negocioId: number) => void;
}

// ─── Singleton de socket ──────────────────────────────────────────────────────

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getSocketUrl(): string {
  if (typeof window === "undefined") return "";

  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || window.location.origin;

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const socketUrl = parsed.origin;
    console.log("[Socket] URL configurada:", rawUrl, "-> Socket URL:", socketUrl);
    return socketUrl;
  } catch (error) {
    console.warn("[Socket] URL de socket inválida, usando valor sin normalizar:", rawUrl, error);
    return rawUrl;
  }
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) return socket;

  // Obtenemos los datos de localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("tienda_comida_token") : null;
  const negocioRaw = typeof window !== "undefined" ? localStorage.getItem("tienda_comida_negocio") : null;
  
  let negocioId: number | null = null;
  if (negocioRaw) {
    try {
      negocioId = JSON.parse(negocioRaw).id;
    } catch (e) {
      console.error("Error parseando negocio de localStorage", e);
    }
  }

  const socketUrl = getSocketUrl();

  console.log("[Socket] Creando conexión a:", socketUrl, "con negocioId:", negocioId);

  socket = io(socketUrl, {
    path: "/socket.io",
    auth: { 
      token, 
      negocio_id: negocioId,
    },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5, // Limitar a 5 intentos en lugar de infinito
    reconnectionDelay: 2000, // Aumentar delay inicial
    reconnectionDelayMax: 10000, // Máximo delay
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log(`[Socket] ✅ Conectado al room del negocio: ${negocioId}`);
  });

  socket.on("disconnect", (reason) => {
    console.warn(`[Socket] ❌ Desconectado (${reason})`);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] ❌ Error de conexión:", err.message, err);
  });

  socket.io.on("reconnect_attempt", (attempt: number) => {
    console.info(`[Socket] 🔄 Intento de reconexión #${attempt}`);
  });

  socket.io.on("reconnect_failed", () => {
    console.error("[Socket] ❌ Fallaron todos los intentos de reconexión");
  });

  return socket;
}


/** Desconecta y limpia el singleton */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function onNuevaOrden(cb: (venta: VentaResponse) => void): void {
  getSocket().on("nueva_orden", cb);
}
export function offNuevaOrden(cb: (venta: VentaResponse) => void): void {
  socket?.off("nueva_orden", cb);
}

export function onOrdenActualizada(cb: (venta: VentaResponse) => void): void {
  getSocket().on("orden_actualizada", cb);
}
export function offOrdenActualizada(cb: (venta: VentaResponse) => void): void {
  socket?.off("orden_actualizada", cb);
}

export function onOrdenLista(cb: (data: { venta_id: number }) => void): void {
  getSocket().on("orden_lista", cb);
}
export function offOrdenLista(cb: (data: { venta_id: number }) => void): void {
  socket?.off("orden_lista", cb);
}