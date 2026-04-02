import { api } from "@/config/api";
import type {
  UserLogin,
  UserLoginResponse,
  OnboardingRequest,
  OnboardingResponse,
} from "@/types/schemas";

/**
 * POST /login
 * Inicia sesión y devuelve JWT + datos del usuario.
 * Guarda el token en localStorage automáticamente.
 */
export async function login(data: UserLogin): Promise<UserLoginResponse> {
  const res = await api.post<UserLoginResponse>("/login", data);
  if (typeof window !== "undefined") {
    localStorage.setItem("tienda_comida_token", res.data.token);
  }
  return res.data;
}

/**
 * POST /onboarding
 * Proceso 0.0 — Registro inicial: crea negocio + admin + configuración.
 * Público, sin JWT.
 */
export async function onboarding(
  data: OnboardingRequest
): Promise<OnboardingResponse> {
  const res = await api.post<OnboardingResponse>("/onboarding", data);
  if (typeof window !== "undefined") {
    localStorage.setItem("tienda_comida_token", res.data.token);
  }
  return res.data;
}