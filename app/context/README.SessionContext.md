# 🧠 Contexto Global de Sesión – `SessionContext`

Este documento describe cómo se construye, valida y mantiene la sesión autenticada global en una app Next.js, combinando React Context, API routes protegidas, y middleware inteligente para garantizar trazabilidad, seguridad y control total de usuario.

---

## 🔗 Flujo completo de sesión

1. **Al iniciar la app**, `SessionProvider` ejecuta `fetchSessionSecure()` vía React Query.
2. Esta función hace un `POST` a `/api/auth/session` con cookies httpOnly y metadata del dispositivo (`meta`).
3. El endpoint `/api/auth/session`:
   - Filtra cookies (`accessKey`, `clientKey`)
   - Valida el `meta` con Zod
   - Reenvía la request al backend real (`/account/me`) con cabeceras seguras
4. El backend valida:
   - Que el `accessToken` exista en Redis
   - Que la `clientKey` coincida con la fingerprint reconstruida
   - Que el token no esté revocado ni expirado
5. Si todo es válido, el backend responde con `{ user, session }`, que queda disponible globalmente con `useSession()`

---

## 🧠 Middleware preventivo – `middleware.ts`

Antes incluso de construir el contexto, un middleware superficial protege las rutas públicas:

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

🔐 **Este middleware no valida la sesión profundamente**. Solo filtra por presencia de cookies y redirige antes de renderizar rutas públicas.

---

## 📦 Archivos involucrados

| Archivo | Propósito |
|--------|-----------|
| `SessionContext.tsx` | React Context + React Query |
| `fetchSessionSecure.ts` | Llama a `/api/auth/session` con `meta` |
| `middleware.ts` | Bloqueo superficial basado en cookies |
| `clientMeta.ts` | Genera fingerprint del dispositivo |
| `api/auth/session/route.ts` | Proxy seguro a `/account/me` |
| `proxyWithCookies.ts` | Reenvía cookies del backend al cliente |

---

## 📤 Estructura del contexto

```ts
interface SessionContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}
```

Disponible vía:

```ts
const { user, session, loading, refresh,isAuthenticated } = useSession();
```

---

## 🛡️ Seguridad y trazabilidad

- Las cookies son httpOnly, `sameSite=strict`, `secure`, y validadas antes de reenviar.
- El backend valida fingerprint (`clientKey`) contra la reconstruida por `meta`.
- Cada request incluye un `X-Request-ID` único.
- En producción, se bloquean IPs privadas si acceden directamente.
- Los errores detallados sólo se devuelven en entorno de desarrollo.

---

## 🧼 Mantenimiento

- El hook `refresh()` permite revalidar sesión a demanda.
- Si cambia la estructura del backend (`/account/me`), actualizar `SessionContextResponse`.
- Agregá campos nuevos al `meta` desde `clientMeta.ts` y reflejalos en el `MetaSchema` del backend.

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Made with 🧠, ⚡, and 🥷
