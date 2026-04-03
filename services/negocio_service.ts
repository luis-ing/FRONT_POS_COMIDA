import { api } from "@/config/api";
import type { NegocioResponse, NegocioUpdate } from "@/types/schemas";

/**
 * GET /negocios — Obtiene la información del negocio autenticado.
 */
export async function getNegocio(): Promise<NegocioResponse> {
  const res = await api.get<NegocioResponse>("/negocios");
  return res.data;
}

/**
 * PATCH /negocios — Actualiza la información del negocio autenticado.
 * Solo envía los campos que deseas cambiar.
 */
export async function updateNegocio(data: NegocioUpdate): Promise<NegocioResponse> {
  const res = await api.patch<NegocioResponse>("/negocios", data);
  return res.data;
}