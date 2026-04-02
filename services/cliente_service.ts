import { api } from "@/config/api";
import type { ClienteCreate, ClienteResponse } from "@/types/schemas";

/**
 * GET /clientes — Proceso 2.2 paso 2
 * @param celular  Filtra por número de WhatsApp (opcional)
 */
export async function getClientes(celular?: string): Promise<ClienteResponse[]> {
  const res = await api.get<ClienteResponse[]>("/clientes", {
    params: celular ? { celular } : undefined,
  });
  return res.data;
}

/** POST /clientes — Proceso 2.2 paso 3 */
export async function createCliente(
  data: ClienteCreate
): Promise<ClienteResponse> {
  const res = await api.post<ClienteResponse>("/clientes", data);
  return res.data;
}