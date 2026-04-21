// lib/media.ts
// ─────────────────────────────────────────────────────────────────────────────
// Helper para construir URLs de imágenes protegidas.
//
// PROBLEMA RAÍZ:
//   next/image con src externo pasa por /_next/image?url=... que hace su
//   propia petición al backend SIN headers/params del cliente → 401.
//
// SOLUCIÓN:
//   Siempre usar unoptimized={true} en <Image> cuando la src venga de
//   buildMediaUrl. Así el browser va DIRECTO al backend con el token en
//   el query param y Next.js no intercepta la petición.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const DEFAULT_IMAGE = "/default-store-350x350.jpg"

/** Lee el JWT del localStorage. Devuelve "" en SSR o si no hay sesión. */
function getToken(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("tienda_comida_token") ?? ""
}

/**
 * Construye la URL de una imagen protegida del backend.
 *
 * Siempre usar el resultado con unoptimized={true} en <Image>:
 *   <Image src={buildMediaUrl(producto.imagenURL)} unoptimized ... />
 *
 * @param imagenURL  Valor relativo guardado en la BD
 *                   Ej: "cafe_delicia/productos/abc123.jpg"
 * @param withToken  Pasar false solo para imágenes públicas o tests
 */
export function buildMediaUrl(
  imagenURL: string | null | undefined,
  withToken = true,
): string {
  if (!imagenURL) return DEFAULT_IMAGE

  const url = `${API_BASE}/media/${imagenURL}`
  if (!withToken) return url

  const token = getToken()
  if (!token) return url

  return `${url}?token=${encodeURIComponent(token)}`
}