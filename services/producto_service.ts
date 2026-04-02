import { api } from "@/config/api";
import type {
  ProductoCreate,
  ProductoUpdate,
  ProductoResponse,
} from "@/types/schemas";

interface ListProductosParams {
  activo?: boolean;
  idCategoria?: number;
}

/**
 * GET /productos — Proceso 0.3 paso 1
 * activo=true → solo disponibles (usado también por n8n para el menú).
 */
export async function getProductos(
  params?: ListProductosParams
): Promise<ProductoResponse[]> {
  const res = await api.get<ProductoResponse[]>("/productos", { params });
  return res.data;
}

/** POST /productos — Proceso 0.3 paso 2 */
export async function createProducto(
  data: ProductoCreate
): Promise<ProductoResponse> {
  const res = await api.post<ProductoResponse>("/productos", data);
  return res.data;
}

/** PATCH /productos/:id — Proceso 0.3 paso 3 */
export async function updateProducto(
  id: number,
  data: ProductoUpdate
): Promise<ProductoResponse> {
  const res = await api.patch<ProductoResponse>(`/productos/${id}`, data);
  return res.data;
}

/** PATCH /productos/:id/desactivar — Proceso 0.3 paso 4 */
export async function desactivarProducto(id: number): Promise<void> {
  await api.patch(`/productos/${id}/desactivar`);
}