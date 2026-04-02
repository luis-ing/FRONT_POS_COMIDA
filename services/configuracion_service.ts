import { api } from "@/config/api";
import type { ConfiguracionResponse, ConfiguracionUpdate } from "@/types/schemas";

/**
 * GET /configuracion — Proceso 0.1 paso 1
 * La crea con defaults si aún no existe.
 */
export async function getConfiguracion(): Promise<ConfiguracionResponse> {
  const res = await api.get<ConfiguracionResponse>("/configuracion");
  return res.data;
}

/**
 * PATCH /configuracion — Proceso 0.1 pasos 2-5
 * Solo envía los campos que deseas cambiar.
 */
export async function updateConfiguracion(
  data: ConfiguracionUpdate
): Promise<ConfiguracionResponse> {
  const res = await api.patch<ConfiguracionResponse>("/configuracion", data);
  return res.data;
}