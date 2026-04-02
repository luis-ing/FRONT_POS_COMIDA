// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface NegocioOnboarding {
  nombre: string;
  telefono?: string;
  direccion?: string;
}

export interface UsuarioOnboarding {
  nombre: string;
  apellidos?: string;
  correo: string;
  contrasena: string;
}

export interface OnboardingRequest {
  negocio: NegocioOnboarding;
  usuario: UsuarioOnboarding;
}

export interface OnboardingResponse {
  negocio_id: number;
  usuario_id: number;
  rol_id: number;
  token: string;
  message: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserLogin {
  correo: string;
  contrasena: string;
}

export interface UserLoginResponse {
  token: string;
  user: UsuarioResponse;
}

// ─── Configuración ────────────────────────────────────────────────────────────

export interface ConfiguracionResponse {
  id: number;
  idNegocio: number;
  pedidosOnlineActivos: boolean;
  diasAtencion: string;
  horariosAtencion: string | null;
  mensajeBienvenida: string | null;
  mensajeFueraHorario: string | null;
  fechaActualizacion: string; // ISO 8601
}

export interface ConfiguracionUpdate {
  pedidosOnlineActivos?: boolean;
  diasAtencion?: string;
  horariosAtencion?: string;
  mensajeBienvenida?: string;
  mensajeFueraHorario?: string;
}

// ─── Roles y Permisos ─────────────────────────────────────────────────────────

export interface PermisoResponse {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
}

export interface RolCreate {
  nombre: string;
  descripcion?: string;
  esAdministrador?: boolean;
  permisos?: number[];
}

export interface RolPermisosUpdate {
  permisos: number[];
}

export interface RolResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  esAdministrador: boolean;
  activo: boolean;
  fechaCreacion: string;
  permisos: PermisoResponse[];
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export interface UsuarioCreate {
  nombre: string;
  apellidos?: string;
  correo: string;
  contrasena: string;
  idRol: number;
}

export interface UsuarioUpdate {
  nombre?: string;
  apellidos?: string;
  correo?: string;
  contrasena?: string;
  idRol?: number;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellidos: string | null;
  correo: string;
  activo: boolean;
  idNegocio: number;
  fechaCreacion: string;
  rol: RolResponse | null;
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export interface CategoriaCreate {
  nombre: string;
  color?: string;
  descripcion?: string;
}

export interface CategoriaUpdate {
  nombre?: string;
  color?: string;
  descripcion?: string;
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
  color: string | null;
  descripcion: string | null;
  activo: boolean;
  idNegocio: number;
  fechaCreacion: string;
}

// ─── Productos ────────────────────────────────────────────────────────────────

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  precio: number;
  requiereCoccion?: boolean;
  idCategoria?: number;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  requiereCoccion?: boolean;
  idCategoria?: number;
}

export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  requiereCoccion: boolean;
  idCategoria: number | null;
  idNegocio: number;
  idusuarioCreador: number;
  fechaCreacion: string;
  categoria: CategoriaResponse | null;
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export interface ClienteCreate {
  nombreCompleto: string;
  celular?: string;
  direccionEntrega?: string;
}

export interface ClienteResponse {
  id: number;
  nombreCompleto: string;
  celular: string | null;
  direccionEntrega: string | null;
  fechaCreacion: string;
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

export interface ProductoLineaInput {
  idProducto: number;
  cantidad: number;
}

export interface DetalleVentaResponse {
  id: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  enviadoACocina: boolean;
  fechaEnvio: string | null;
  producto: ProductoResponse | null;
}

export interface VentaDirectaCreate {
  idMetodoPago: number;
  idCanalVenta: number;
  idCliente?: number;
  notas?: string;
  productos: ProductoLineaInput[];
}

export interface VentaAbrirCreate {
  idCanalVenta: number;
  idCliente?: number;
  notas?: string;
}

export interface AgregarProductosInput {
  productos: ProductoLineaInput[];
}

export interface CerrarVentaInput {
  idMetodoPago: number;
}

export interface EstatusOrdenUpdate {
  idEstatusOrden: number;
}

export interface VentaResponse {
  id: number;
  total: number;
  notas: string | null;
  idEstatusOrden: number;
  idEstatusPago: number;
  idNegocio: number;
  idCanalVenta: number;
  idMetodoPago: number | null;
  idCliente: number | null;
  idusuarioCreador: number;
  idusuarioCocinero: number | null;
  horaOrdenCocinada: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: DetalleVentaResponse[];
}

// ─── Catálogos ────────────────────────────────────────────────────────────────

export interface MetodoPagoResponse {
  id: number;
  metodo: string;
  activo: boolean;
}

export interface CanalVentaResponse {
  id: number;
  canal: string;
  activo: boolean;
}

export interface EstatusOrdenResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

export interface EstatusPagoResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
}