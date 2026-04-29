# AGENTS.md

## Dev Commands

```bash
pnpm dev      # Start dev server (port 3000)
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

No typecheck or test scripts exist.

## Architecture

- Next.js 16 App Router with React 19
- Tailwind CSS 4 (CSS-based config, no tailwind.config.ts)
- Radix UI components (shadcn-like)
- Services in `/services` call backend API at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
- Real-time via socket.io client in `/services/socket_client.ts`

## Pages (Routes)

| Path | Purpose |
|------|---------|
| `/` | POS main |
| `/productos` | Product catalog |
| `/ordenes` | Order management |
| `/ordenes-abiertas` | Open orders |
| `/clientes` | Customer management |
| `/cocina` | Kitchen view |
| `/configuracion` | Settings |
| `/usuarios` | User management |
| `/calculadora` | Calculator |
| `/(auth)/login` | Login |
| `/(auth)/registro` | Registration |

## Env

- `NEXT_PUBLIC_API_URL` - Backend API (required)
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID

## Build Notes

- `next.config.mjs`: `ignoreBuildErrors: true` for TypeScript during build
- Images allowed from `localhost:8000` and `apipos.nodelog.online`
- Deploy via Docker (see `.github/workflows/deploy.yml`)

## Cancellation Rules (Total & Partial)

### Core Constraints
- All cancellation reasons (total and partial) are mandatory.
- Cancellation info display format: `Cancelado por [usuario] - [motivo]` (rendered as small, discreet `text-xs text-destructive/80` text).
- Canceled order items are never removed from views: they remain visible with muted styling.

### Total Cancellation
- **Eligibility**: Only allowed for sales created within the last 2 weeks (validated frontend via `dentroDelLimiteCancelacionTotal()` in `lib/venta-utils.ts`, backend enforces same rule).
- **UI Behavior**:
  - "Cancelar orden" buttons are hidden/disabled for already canceled orders (checks both payment status `CANCELADA` and order status `cancelada`).
  - Uses `CancelModal` with `motivoRequerido={true}` and `disabled` prop to lock fields for non-eligible orders.
  - Time limit message shown via `mensajeLimiteCancelacionTotal()`.

### Partial Cancellation
- **Eligibility**:
  - Only allowed for orders with payment status `ABIERTA`.
  - Only allowed within 1 week (7 days) of the order's opening time (validated via `dentroDelLimiteCancelacion()` in `lib/venta-utils.ts`).
- **UI Behavior**:
  - Canceled items retain `opacity-60` styling with `line-through` and `text-destructive/70` (KitchenView), or `opacity-60 border-destructive/30` (CartPanel).
  - Per-item cancel buttons are disabled outside the 1-week window, with tooltip showing the limit message via `mensajeLimiteCancelacion()` and "+7d" indicator.
- **Data Formats**: Frontend handles two cancellation data formats:
  - Socket payload (`orden_actualizada` event): `cancelado` field is an object `{ fechaCancelacion: string, motivo?: string, usuarioNombre?: string }` (matches `DetalleVentaCancelacionInfo` interface).
  - API GET payload: `cancelacion` field is an array of `DetalleVentaCancelacionResponse` (uses first array element for display).
- **Utilities**: `lib/venta-utils.ts` provides unified handlers:
  - `estaDetalleCancelado(detalle)`: Checks if a detail line is canceled (supports both formats).
  - `getCanceladoInfo(detalle)`: Returns normalized cancellation info object (supports both formats).

### Real-Time Updates
- Socket event `orden_actualizada` sends `cancelado` as an object (replaces legacy boolean) with cancellation metadata for updated order details.
- Backend `services/venta_service.py` (Python) `_venta_to_socket_dict()` method serializes cancellation data into the socket payload.

### Modified Files
| File | Changes |
|------|---------|
| `types/schemas.ts` | Added `DetalleVentaCancelacionInfo` interface; updated `DetalleVentaResponse` with optional `cancelado` field; added `usuarioNombre` to `DetalleVentaCancelacionResponse` |
| `lib/venta-utils.ts` | Added cancellation utilities: `estaDetalleCancelado`, `getCanceladoInfo`, `dentroDelLimiteCancelacion`, `mensajeLimiteCancelacion`, `esVentaDeHoy`, `admiteCancelacionParcial` |
| `components/kitchen/kitchen-view.tsx` | Renders canceled items with strikethrough and cancellation info |
| `components/catalog/cart-panel.tsx` | Renders canceled cart items with opacity/border styling and cancellation info |
| `components/catalog/cancel-modal.tsx` | Added `disabled` prop to disable fields/buttons for non-cancelable orders |
| `components/catalog/catalog-view.tsx` | Enforced mandatory cancellation reason; added current-day sales validation for total cancellation |
| `components/orders/open-orders-view.tsx` | Displays partial cancellation info in order detail modal; fixed missing `mensajeLimiteCancelacion` import |
| `components/orders/orders-view.tsx` | Updated `esCancelable` to disable "Cancelar orden" for already-canceled orders; displays partial cancellation info in detail modal |
| Backend `services/venta_service.py` | Updated `_venta_to_socket_dict()` to send `cancelado` as object with cancellation metadata |