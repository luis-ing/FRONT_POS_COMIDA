import type { DetalleVentaResponse, VentaResponse } from "@/types/schemas"

/** Horas máximas permitidas para cancelar un producto de una orden */
export const LIMITE_HORAS_CANCELACION_PARCIAL = 2

/**
 * Devuelve true si el detalle tiene al menos un registro de cancelación.
 * El backend carga la relación `cancelacion` como array.
 */
export function estaDetalleCancelado(detalle: DetalleVentaResponse): boolean {
  return Array.isArray(detalle.cancelacion) && detalle.cancelacion.length > 0
}

/**
 * Calcula cuántos minutos han pasado desde la apertura de la venta.
 */
export function minutosDesdeApertura(venta: VentaResponse): number {
  return Math.floor((Date.now() - new Date(venta.fechaApertura).getTime()) / 60000)
}

/**
 * Devuelve true si la venta está dentro del límite de tiempo permitido
 * para realizar cancelaciones parciales.
 */
export function dentroDelLimiteCancelacion(venta: VentaResponse): boolean {
  return minutosDesdeApertura(venta) < LIMITE_HORAS_CANCELACION_PARCIAL * 60
}

/**
 * Mensaje de tooltip/hint cuando la cancelación parcial no está disponible
 * por tiempo.
 */
export function mensajeLimiteCancelacion(): string {
  return `Solo se pueden cancelar productos de órdenes con menos de ${LIMITE_HORAS_CANCELACION_PARCIAL} horas de antigüedad.`
}

/**
 * Devuelve true si la orden puede recibir cancelaciones parciales:
 * - idEstatusPago = ABIERTA (el front lo verifica por nombre del idEstatusPago,
 *   pero como el front solo tiene el id, pasamos el nombre del estatusPago).
 * - Dentro del límite de 2 horas.
 */
export function admiteCancelacionParcial(
  venta: VentaResponse,
  nombreEstatusPago: string,
): boolean {
  return nombreEstatusPago === "ABIERTA" && dentroDelLimiteCancelacion(venta)
}

/**
 * Devuelve true si la venta fue creada el día actual.
 */
export function esVentaDeHoy(venta: VentaResponse): boolean {
  const hoy = new Date()
  const fechaVenta = new Date(venta.fechaApertura)
  return (
    fechaVenta.getDate() === hoy.getDate() &&
    fechaVenta.getMonth() === hoy.getMonth() &&
    fechaVenta.getFullYear() === hoy.getFullYear()
  )
}