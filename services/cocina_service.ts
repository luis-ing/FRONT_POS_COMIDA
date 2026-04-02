import { api } from "@/config/api";
import type { VentaResponse } from "@/types/schemas";

/**
 * PATCH /cocina/:id/en-preparacion
 * Proceso 1.2 paso 3 — El cocinero inicia la preparación.
 */
export async function marcarEnPreparacion(
  ventaId: number
): Promise<VentaResponse> {
  const res = await api.patch<VentaResponse>(
    `/cocina/${ventaId}/en-preparacion`
  );
  return res.data;
}

/**
 * PATCH /cocina/:id/lista
 * Proceso 1.2 pasos 4-5 — Marca como lista + emite socket 'orden_lista'.
 */
export async function marcarOrdenLista(
  ventaId: number
): Promise<VentaResponse> {
  const res = await api.patch<VentaResponse>(`/cocina/${ventaId}/lista`);
  return res.data;
}