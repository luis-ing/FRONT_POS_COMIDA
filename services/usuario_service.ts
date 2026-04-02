import { api } from "@/config/api";
import type {
  UsuarioCreate,
  UsuarioUpdate,
  UsuarioResponse,
} from "@/types/schemas";

/** GET /usuarios — Proceso 0.4 */
export async function getUsuarios(): Promise<UsuarioResponse[]> {
  const res = await api.get<UsuarioResponse[]>("/usuarios");
  return res.data;
}

/** POST /usuarios — Proceso 0.4 paso 1 */
export async function createUsuario(
  data: UsuarioCreate
): Promise<UsuarioResponse> {
  const res = await api.post<UsuarioResponse>("/usuarios", data);
  return res.data;
}

/** PATCH /usuarios/:id — Proceso 0.4 pasos 2-3 */
export async function updateUsuario(
  id: number,
  data: UsuarioUpdate
): Promise<UsuarioResponse> {
  const res = await api.patch<UsuarioResponse>(`/usuarios/${id}`, data);
  return res.data;
}

/** PATCH /usuarios/:id/desactivar — Proceso 0.4 paso 4 */
export async function desactivarUsuario(id: number): Promise<void> {
  await api.patch(`/usuarios/${id}/desactivar`);
}