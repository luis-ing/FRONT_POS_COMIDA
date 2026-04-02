import { api } from "@/config/api";
import type {
  CategoriaCreate,
  CategoriaUpdate,
  CategoriaResponse,
} from "@/types/schemas";

/** GET /categorias — Proceso 0.2 paso 1 */
export async function getCategorias(): Promise<CategoriaResponse[]> {
  const res = await api.get<CategoriaResponse[]>("/categorias");
  return res.data;
}

/** POST /categorias — Proceso 0.2 paso 2 */
export async function createCategoria(
  data: CategoriaCreate
): Promise<CategoriaResponse> {
  const res = await api.post<CategoriaResponse>("/categorias", data);
  return res.data;
}

/** PATCH /categorias/:id — Proceso 0.2 paso 3 */
export async function updateCategoria(
  id: number,
  data: CategoriaUpdate
): Promise<CategoriaResponse> {
  const res = await api.patch<CategoriaResponse>(`/categorias/${id}`, data);
  return res.data;
}

/** PATCH /categorias/:id/desactivar — Proceso 0.2 paso 4 */
export async function desactivarCategoria(id: number): Promise<void> {
  await api.patch(`/categorias/${id}/desactivar`);
}