/**
 * socket_client.ts
 * Cliente WebSocket tipado para los eventos de cocina en tiempo real.
 *
 * Dependencia: socket.io-client
 *   npm install socket.io-client
 *   npm install -D @types/socket.io-client  (si no está incluido)
 *
 * Uso en un componente:
 *   import { getSocket, onNuevaOrden, offNuevaOrden } from "@/services/socket_client"
 *
 *   useEffect(() => {
 *     const socket = getSocket()
 *     onNuevaOrden((venta) => setOrdenes(prev => [...prev, venta]))
 *     return () => { offNuevaOrden(); socket.disconnect() }
 *   }, [])
 */

import { io, Socket } from "socket.io-client";
import type { VentaResponse } from "@/types/schemas";

// ─── Tipos de eventos ─────────────────────────────────────────────────────────

interface ServerToClientEvents {
  /** Flujo 1 y primer envío del Flujo 2 — orden completa nueva */
  nueva_orden: (venta: VentaResponse) => void;
  /** Envíos siguientes del Flujo 2 — solo los productos nuevos */
  orden_actualizada: (venta: VentaResponse) => void;
  /** El cocinero marcó la orden como lista — avisa al vendedor */
  orden_lista: (venta: VentaResponse) => void;
}

interface ClientToServerEvents {
  /** El cliente se une al room de su negocio al conectarse */
  join_negocio: (negocioId: number) => void;
}

// ─── Singleton de socket ──────────────────────────────────────────────────────

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Devuelve (o crea) la instancia de socket para el negocio autenticado.
 * Llama a esto una vez al montar el layout que requiere tiempo real.
 */
export function getSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  if (socket?.connected) return socket;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("tienda_comida_token")
      : null;

  socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
    auth: { token },          // el backend valida el JWT en el handshake
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    const negocioRaw =
      typeof window !== "undefined"
        ? localStorage.getItem("tienda_comida_negocio")
        : null;

    if (negocioRaw) {
      const negocio = JSON.parse(negocioRaw);
      socket?.emit("join_negocio", negocio.id);
    }
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Error de conexión:", err.message);
  });

  return socket;
}

/** Desconecta y limpia el singleton (útil en logout). */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// ─── Helpers tipados por evento ───────────────────────────────────────────────

export function onNuevaOrden(cb: (venta: VentaResponse) => void): void {
  getSocket().on("nueva_orden", cb);
}
export function offNuevaOrden(cb?: (venta: VentaResponse) => void): void {
  cb ? getSocket().off("nueva_orden", cb) : getSocket().off("nueva_orden");
}

export function onOrdenActualizada(cb: (venta: VentaResponse) => void): void {
  getSocket().on("orden_actualizada", cb);
}
export function offOrdenActualizada(
  cb?: (venta: VentaResponse) => void
): void {
  cb
    ? getSocket().off("orden_actualizada", cb)
    : getSocket().off("orden_actualizada");
}

export function onOrdenLista(cb: (venta: VentaResponse) => void): void {
  getSocket().on("orden_lista", cb);
}
export function offOrdenLista(cb?: (venta: VentaResponse) => void): void {
  cb ? getSocket().off("orden_lista", cb) : getSocket().off("orden_lista");
}