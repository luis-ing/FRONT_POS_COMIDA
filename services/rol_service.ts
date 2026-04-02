import { api } from "@/config/api";
import type {
  RolCreate,
  RolPermisosUpdate,
  RolResponse,
  PermisoResponse,
} from "@/types/schemas";

/** GET /permisos — Proceso 0.5 paso 1 */
export async function getPermisos(): Promise<PermisoResponse[]> {
  const res = await api.get<PermisoResponse[]>("/permisos");
  return res.data;
}

/** GET /roles — Proceso 0.5 paso 2 */
export async function getRoles(): Promise<RolResponse[]> {
  const res = await api.get<RolResponse[]>("/roles");
  return res.data;
}

/** POST /roles — Proceso 0.5 paso 3 */
export async function createRol(data: RolCreate): Promise<RolResponse> {
  const res = await api.post<RolResponse>("/roles", data);
  return res.data;
}

/**
 * PATCH /roles/:id/permisos — Proceso 0.5 pasos 4-5
 * Reemplaza el conjunto COMPLETO de permisos del rol.
 */
export async function updatePermisosRol(
  id: number,
  data: RolPermisosUpdate
): Promise<RolResponse> {
  const res = await api.patch<RolResponse>(`/roles/${id}/permisos`, data);
  return res.data;
}

/** PATCH /roles/:id/desactivar — Proceso 0.5 paso 6 */
export async function desactivarRol(id: number): Promise<void> {
  await api.patch(`/roles/${id}/desactivar`);
}