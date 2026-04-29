import type { DetalleVentaResponse, VentaResponse, DetalleVentaCancelacionInfo } from "@/types/schemas"

/** Semanas máximas permitidas para cancelar una orden completa */
export const LIMITE_SEMANAS_CANCELACION_TOTAL = 2

/** Días máximos permitidos para cancelar un producto de una orden (1 semana) */
export const LIMITE_DIAS_CANCELACION_PARCIAL = 7

/**
 * Devuelve true si el detalle tiene al menos un registro de cancelación.
 * Maneja ambos casos: backend puede enviar `cancelacion` (API GET) o `cancelado` (socket).
 */
export function estaDetalleCancelado(detalle: any): boolean {
  // Socket: cancelado es un objeto
  if (detalle.cancelado && typeof detalle.cancelado === 'object') return true
  // API GET: cancelacion es un array
  if (Array.isArray(detalle.cancelacion) && detalle.cancelacion.length > 0) return true
  return false
}

/**
 * Obtiene la información de cancelación (quién y por qué).
 * Maneja ambos formatos: `cancelado` (socket) y `cancelacion` (API GET).
 */
export function getCanceladoInfo(detalle: any): DetalleVentaCancelacionInfo | null {
  // Socket payload: cancelado es objeto
  if (detalle.cancelado && typeof detalle.cancelado === 'object') {
    return detalle.cancelado as DetalleVentaCancelacionInfo
  }
  
  // API GET payload: cancelacion es array
  if (Array.isArray(detalle.cancelacion) && detalle.cancelacion.length > 0) {
    const c = detalle.cancelacion[0]
    return {
      fechaCancelacion: c.fechaCancelacion,
      motivo: c.motivo,
      usuarioNombre: c.usuarioNombre,
    }
  }
  
  return null
}

/**
 * Calcula cuántos minutos han pasado desde la apertura de la venta.
 */
export function minutosDesdeApertura(venta: VentaResponse): number {
  return Math.floor((Date.now() - new Date(venta.fechaApertura).getTime()) / 60000)
}

/**
 * Devuelve true si la venta está dentro del límite de tiempo permitido
 * para realizar cancelaciones parciales (1 semana).
 */
export function dentroDelLimiteCancelacion(venta: VentaResponse): boolean {
  const diasDesdeApertura = Math.floor(
    (Date.now() - new Date(venta.fechaApertura).getTime()) / (1000 * 60 * 60 * 24)
  )
  return diasDesdeApertura < LIMITE_DIAS_CANCELACION_PARCIAL
}

/**
 * Mensaje de tooltip/hint cuando la cancelación parcial no está disponible
 * por tiempo.
 */
export function mensajeLimiteCancelacion(): string {
  return `Solo se pueden cancelar productos de órdenes con menos de ${LIMITE_DIAS_CANCELACION_PARCIAL} días (1 semana) de antigüedad.`
}

/**
 * Devuelve true si la venta está dentro del límite de tiempo permitido
 * para realizar cancelaciones totales (2 semanas).
 */
export function dentroDelLimiteCancelacionTotal(venta: VentaResponse): boolean {
  const diasDesdeApertura = Math.floor(
    (Date.now() - new Date(venta.fechaApertura).getTime()) / (1000 * 60 * 60 * 24)
  )
  return diasDesdeApertura < LIMITE_SEMANAS_CANCELACION_TOTAL * 7
}

/**
 * Mensaje cuando la cancelación total no está disponible por tiempo.
 */
export function mensajeLimiteCancelacionTotal(): string {
  return `Solo se pueden cancelar ventas con menos de ${LIMITE_SEMANAS_CANCELACION_TOTAL} semanas de antigüedad.`
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