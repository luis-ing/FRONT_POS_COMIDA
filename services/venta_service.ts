import { api } from "@/config/api";
import type {
  VentaDirectaCreate,
  VentaAbrirCreate,
  AgregarProductosInput,
  CerrarVentaInput,
  EstatusOrdenUpdate,
  VentaResponse,
  CancelarVentaInput,
  CancelarProductoInput,
  VentaPaginatedResponse,
} from "@/types/schemas";

interface ListVentasParams {
  idEstatusPago?: number;
  idEstatusOrden?: number;
  desde?: string;
  hasta?: string;
  excluirPagadasCanceladas?: boolean;
  paginacion?: boolean;
  pagina?: number;
  por_pagina?: number;
  busqueda?: string;
  ordenar_por?: string;
  orden?: 'asc' | 'desc';
}

// ─── Consultas ────────────────────────────────────────────────────────────────

/** GET /ventas (sin paginación, compatibilidad hacia atrás) */
export async function getVentas(
  params?: ListVentasParams
): Promise<VentaResponse[]> {
  const res = await api.get<VentaResponse[]>("/ventas", { params });
  return res.data;
}

/** GET /ventas con paginación */
export async function getVentasPaginadas(
  params?: ListVentasParams
): Promise<VentaPaginatedResponse> {
  const res = await api.get<VentaPaginatedResponse>("/ventas", {
    params: { ...params, paginacion: true },
  });
  return res.data;
}

/**
 * GET /ventas/cocina/activas
 * Proceso 1.3 paso 1 — Cola inicial del cocinero al conectarse.
 */
export async function getVentasActivasCocina(): Promise<VentaResponse[]> {
  const res = await api.get<VentaResponse[]>("/ventas/cocina/activas");
  return res.data;
}

/** GET /ventas/:id */
export async function getVenta(id: number): Promise<VentaResponse> {
  const res = await api.get<VentaResponse>(`/ventas/${id}`);
  return res.data;
}

// ─── Flujo 1 — Cobro inmediato ────────────────────────────────────────────────

/**
 * POST /ventas
 * Proceso 1.1 / 2.3 — Crea venta cerrada y emite socket 'nueva_orden'.
 */
export async function crearVentaDirecta(
  data: VentaDirectaCreate
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>("/ventas", data);
  return res.data;
}

// ─── Flujo 2 — Orden abierta ──────────────────────────────────────────────────

/**
 * POST /ventas/abrir
 * Proceso 1.2 paso 1 — Abre una orden sin productos ni método de pago.
 */
export async function abrirOrden(
  data: VentaAbrirCreate
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>("/ventas/abrir", data);
  return res.data;
}

/**
 * POST /ventas/:id/productos
 * Proceso 1.2 pasos 2 y 4 — Agrega productos a la orden abierta.
 */
export async function agregarProductos(
  ventaId: number,
  data: AgregarProductosInput
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>(`/ventas/${ventaId}/productos`, data);
  return res.data;
}

/**
 * POST /ventas/:id/enviar-cocina
 * Proceso 1.2 pasos 3 y 5 — Emite socket 'nueva_orden' o 'orden_actualizada'.
 */
export async function enviarACocina(ventaId: number): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>(`/ventas/${ventaId}/enviar-cocina`);
  return res.data;
}

/**
 * POST /ventas/:id/cerrar
 * Proceso 1.2 paso 6 — Cobra y cierra la orden.
 */
export async function cerrarOrden(
  ventaId: number,
  data: CerrarVentaInput
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>(`/ventas/${ventaId}/cerrar`, data);
  return res.data;
}

// ─── Cocina ───────────────────────────────────────────────────────────────────

/**
 * PATCH /ventas/:id/estatus-orden
 * Procesos 1.3 / 1.4 — Ciclo: pendiente → en_preparacion → lista → entregada.
 * Al marcar 'lista' emite socket 'orden_lista'.
 */
export async function updateEstatusOrden(
  ventaId: number,
  data: EstatusOrdenUpdate
): Promise<VentaResponse> {
  const res = await api.patch<VentaResponse>(
    `/ventas/${ventaId}/estatus-orden`,
    data
  );
  return res.data;
}

// ─── Cancelaciones ────────────────────────────────────────────────────────────

/**
 * POST /ventas/:id/cancelar
 * Cancela la venta completa.
 * - ABIERTA → cancela directamente.
 * - CERRADA → cancela con prefijo [REEMBOLSO] en notas.
 * Emite socket 'orden_cancelada'.
 */
export async function cancelarVenta(
  ventaId: number,
  data: CancelarVentaInput
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>(`/ventas/${ventaId}/cancelar`, data);
  return res.data;
}

/**
 * POST /ventas/:id/cancelar-producto
 * Cancela una línea de producto dentro de una venta ABIERTA.
 * Resta el subtotal del total de la venta.
 * Emite socket 'orden_actualizada'.
 */
export async function cancelarProducto(
  ventaId: number,
  data: CancelarProductoInput
): Promise<VentaResponse> {
  const res = await api.post<VentaResponse>(
    `/ventas/${ventaId}/cancelar-producto`,
    data
  );
  return res.data;
}