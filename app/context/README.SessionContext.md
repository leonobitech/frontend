# 🧠 Contexto Global de Sesión – `SessionContext`

Este documento describe cómo se construye, valida y mantiene la sesión autenticada global en una app Next.js, combinando React Context, API routes protegidas, middleware preventivo y hooks defensivos como `useSessionGuard` para garantizar trazabilidad, seguridad y control total del usuario.

---

## 🔗 Flujo completo de sesión

1. **Al iniciar la app**, `SessionProvider` ejecuta `fetchSessionSecure()` vía React Query.
2. Esta función hace un `POST` a `/api/auth/session` con cookies httpOnly (`accessKey`, `clientKey`) y metadata del dispositivo (`meta`).
3. El endpoint `/api/auth/session`:
   - Filtra cookies válidas
   - Valida `meta` con Zod
   - Reenvía la request al backend real (`/account/me`) con cabeceras seguras
4. El backend valida:
   - Que el `accessToken` exista y esté activo en Redis
   - Que el `clientKey` coincida con la fingerprint reconstruida desde `meta`
   - Que el token no esté revocado ni expirado
5. Si todo es válido, el backend responde con `{ user, session }`, que queda disponible globalmente a través de `useSession()`

---

## 🧱 Capas de protección

### 🛡️ `useSessionGuard()`

Hook defensivo usado en páginas privadas (`/dashboard`, `/settings`, etc.). Reemplaza el típico `useEffect()` que redirige si no hay sesión activa.

```ts
const { user, session, loading } = useSessionGuard({
  redirectTo: "/login", // opcional
});
```

- Encapsula `useSession()`
- Redirige automáticamente si no hay sesión
- Retorna también los mismos valores (`user`, `session`, `loading`)
- Puede usarse en componentes cliente (`"use client"`)

---

### 🚧 `middleware.ts` – Protección superficial de rutas públicas

```ts
export const config = {
  matcher: ["/login", "/register", "/verify-email"],
};

export async function middleware(req: NextRequest) {
  const accessKey = req.cookies.get("accessKey")?.value;
  const clientKey = req.cookies.get("clientKey")?.value;

  if (!accessKey || !clientKey) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const cleanPath = pathname.replace(/\/+$/, "");

  const blocked = ["/login", "/register", "/verify-email"];
  if (blocked.includes(cleanPath)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

🔐 **Este middleware no valida la sesión profundamente.** Solo bloquea el acceso a rutas públicas si ya hay cookies httpOnly presentes.

---

## 📦 Archivos involucrados

| Archivo | Propósito |
|--------|-----------|
| `SessionContext.tsx` | React Context + React Query que provee `useSession()` |
| `fetchSessionSecure.ts` | Ejecuta el fetch con cookies + metadata al backend |
| `useSessionGuard.ts` | Hook para proteger rutas privadas desde el cliente |
| `middleware.ts` | Filtro superficial por cookies en rutas públicas |
| `clientMeta.ts` | Genera huella digital (`meta`) del dispositivo |
| `api/auth/session/route.ts` | Proxy seguro a `/account/me` con cookies + meta |
| `proxyWithCookies.ts` | Reenvía cookies del backend real al cliente Next.js |

---

## 📤 Estructura del contexto

```ts
interface SessionContextValue {
  user: ExtendedSessionUser | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}
```

Disponible globalmente vía:

```ts
const { user, session, loading, refresh, isAuthenticated } = useSession();
```

---

## 🛡️ Seguridad y trazabilidad

- Cookies httpOnly, `sameSite=strict`, `secure`, sólo leídas en backend.
- Fingerprint (`clientKey`) reconstruido desde `meta` y validado.
- Redis como capa de autenticación activa (accessToken).
- Cada request lleva un `X-Request-ID` único para trazabilidad.
- Middleware preventivo para usuarios autenticados en rutas públicas.
- Detalles de error limitados en producción (`NODE_ENV` checkeado).

---

## 🧼 Mantenimiento

- Usar `refresh()` para invalidar y revalidar sesión manualmente.
- Si cambia el backend (`/account/me`), actualizar `SessionContextResponse`.
- Si agregás campos nuevos a `meta`, también actualizá:
  - `clientMeta.ts`
  - `MetaSchema` en el backend
  - Validaciones en `verifyAccessTokenFromCookies`

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Made with 🧠, ⚡, and 🥷
