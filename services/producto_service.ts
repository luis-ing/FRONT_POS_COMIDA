import { api } from "@/config/api";
import type { ProductoCreate, ProductoUpdate, ProductoResponse } from "@/types/schemas";

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

/**
 * POST /productos — Proceso 0.3 paso 2
 * El backend ahora espera multipart/form-data (no JSON) para soportar imagen.
 */
export async function createProducto(
  data: ProductoCreate,
  imagen?: File | null
): Promise<ProductoResponse> {
  const form = new FormData();
  form.append("nombre", data.nombre);
  form.append("precio", String(data.precio));
  if (data.descripcion)     form.append("descripcion",     data.descripcion);
  if (data.requiereCoccion !== undefined)
                             form.append("requiereCoccion", String(data.requiereCoccion));
  if (data.idCategoria)     form.append("idCategoria",     String(data.idCategoria));
  if (imagen)               form.append("imagen",          imagen);

  const res = await api.post<ProductoResponse>("/productos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * PATCH /productos/:id — Proceso 0.3 paso 3
 * También multipart/form-data para poder reemplazar la imagen.
 */
export async function updateProducto(
  id: number,
  data: ProductoUpdate,
  imagen?: File | null
): Promise<ProductoResponse> {
  const form = new FormData();
  if (data.nombre          !== undefined) form.append("nombre",          data.nombre);
  if (data.descripcion     !== undefined) form.append("descripcion",     data.descripcion ?? "");
  if (data.precio          !== undefined) form.append("precio",          String(data.precio));
  if (data.requiereCoccion !== undefined) form.append("requiereCoccion", String(data.requiereCoccion));
  if (data.idCategoria     !== undefined) form.append("idCategoria",     String(data.idCategoria));
  if (imagen)                             form.append("imagen",          imagen);

  const res = await api.patch<ProductoResponse>(`/productos/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** PATCH /productos/:id/desactivar — Proceso 0.3 paso 4 */
export async function desactivarProducto(id: number): Promise<void> {
  await api.patch(`/productos/${id}/desactivar`);
}