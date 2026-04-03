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

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) return socket;

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

  socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
    auth: { 
      token, 
      negocio_id: negocioId // CORRECCIÓN: Se envía aquí para que el backend lo reciba en 'connect'
    },
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log(`[Socket] Conectado al room del negocio: ${negocioId}`);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Error de conexión:", err.message);
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
export function offNuevaOrden(): void {
  getSocket().off("nueva_orden");
}

export function onOrdenActualizada(cb: (venta: VentaResponse) => void): void {
  getSocket().on("orden_actualizada", cb);
}
export function offOrdenActualizada(): void {
  getSocket().off("orden_actualizada");
}

// CORRECCIÓN: El tipo del callback debe coincidir con el ID enviado por el backend
export function onOrdenLista(cb: (data: { venta_id: number }) => void): void {
  getSocket().on("orden_lista", cb);
}
export function offOrdenLista(): void {
  getSocket().off("orden_lista");
}