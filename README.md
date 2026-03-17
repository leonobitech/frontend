# Leonobitech — Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-All_Rights_Reserved-red)

Frontend de **Leonobitech**, agencia de implementaciones Odoo potenciadas por agentes de IA y servidores MCP.

---

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Radix UI primitives
- **Animations**: Framer Motion
- **State**: Zustand + TanStack Query + React Context
- **Forms**: React Hook Form + Zod
- **Auth**: Cookie-based sessions (JWT + passkeys)
- **Themes**: next-themes (light/dark)

## Estructura

```
app/
├── page.tsx              # Landing page (agencia)
├── login/                # Autenticación
├── register/             # Registro
├── verify-email/         # Verificación OTP
├── forgot-password/      # Recuperación de contraseña
├── auth/                 # Passkey setup/verify/recover
├── dashboard/            # Panel admin (protegido)
├── settings/             # Configuración de cuenta
├── legal/                # Términos legales
├── privacy-policy/       # Política de privacidad
└── api/                  # API routes (auth, admin)

components/
├── Navbar.tsx            # Navegación principal
├── Footer.tsx            # Footer (siempre oscuro)
├── ThemeToggle.tsx       # Toggle theme (navbar)
├── ThemeSwitch.tsx       # Switch theme (sidebar)
├── OtpInput.tsx          # Input OTP 6 dígitos
├── Sidebar/              # Sidebar dashboard (siempre oscura)
├── layout/               # Desktop/Mobile/Responsive layouts
├── ui/                   # Componentes base (button, card, input, select, etc.)
└── security/             # Turnstile widget
```

## Design System

Escala de grises neutra — el logo (gradiente magenta→blue) es el único color.

| Elemento | Light | Dark |
|----------|-------|------|
| Background | `#E8EAED` | `#2B2B2B` |
| Cards | `#DFE1E5` | `#333333` |
| Foreground | `#3A3A3A` | `#D1D5DB` |
| Sidebar | `#2B2B2B` (siempre) | `#2B2B2B` |
| Footer | `#2B2B2B` (siempre) | `#222222` |
| CTAs | `#3A3A3A` bg / white text | `#D1D5DB` bg / `#3A3A3A` text |
| Border radius | 4px global (`--radius: 0.25rem`) | — |
| Hover buttons | shadow-md → shadow-lg | — |

## Desarrollo

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build producción
npm run lint         # ESLint
```

## Deploy

Self-hosted en VPS con Docker + Traefik. CI/CD automático via GitHub Actions en push a `main`.

## Servicios (Landing)

- Implementación Odoo (ERP, CRM, Inventario, Contabilidad)
- Agentes de IA (WhatsApp, ventas, atención al cliente)
- Integraciones MCP (Model Context Protocol)
- Desarrollo a medida

## Contacto

- Web: [leonobitech.com](https://www.leonobitech.com)
- Email: felix@leonobitech.com
- LinkedIn: [linkedin.com/company/leonobitech](https://linkedin.com/company/leonobitech)

## Licencia

All Rights Reserved. Copyright (c) 2026 Leonobitech.
