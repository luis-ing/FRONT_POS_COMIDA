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