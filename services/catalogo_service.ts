import { api } from "@/config/api";
import type {
  MetodoPagoResponse,
  CanalVentaResponse,
  EstatusOrdenResponse,
  EstatusPagoResponse,
} from "@/types/schemas";

/** GET /catalogos/metodos-pago */
export async function getMetodosPago(): Promise<MetodoPagoResponse[]> {
  const res = await api.get<MetodoPagoResponse[]>("/catalogos/metodos-pago");
  return res.data;
}

/** GET /catalogos/canales-venta */
export async function getCanalesVenta(): Promise<CanalVentaResponse[]> {
  const res = await api.get<CanalVentaResponse[]>("/catalogos/canales-venta");
  return res.data;
}

/** GET /catalogos/estatus-orden */
export async function getEstatusOrden(): Promise<EstatusOrdenResponse[]> {
  const res = await api.get<EstatusOrdenResponse[]>("/catalogos/estatus-orden");
  return res.data;
}

/** GET /catalogos/estatus-pago */
export async function getEstatusPago(): Promise<EstatusPagoResponse[]> {
  const res = await api.get<EstatusPagoResponse[]>("/catalogos/estatus-pago");
  return res.data;
}