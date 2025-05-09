# 🧠 Contexto Global de Sesión – `SessionContext`

Este módulo provee el acceso global a la sesión autenticada (`user` y `session`) dentro de toda la aplicación. Es una capa que abstrae la llamada al backend (`/account/me`) y expone el estado a través de React Context, usando `@tanstack/react-query`.

---

## 🔗 Flujo de funcionamiento

1. Al iniciar la app, `SessionProvider` hace un `POST` a `/api/auth/session`.
2. Este endpoint actúa como proxy seguro al backend (`/account/me`), incluyendo:
   - Las cookies actuales
   - Un objeto `meta` generado desde el cliente (info del dispositivo, IP, resolución, etc.)
3. El backend responde con `{ user, session }`.
4. Esa data queda disponible vía `useSession()` en toda la app.

---

## 🧩 Archivos involucrados

| Archivo | Propósito |
|--------|-----------|
| `SessionContext.tsx` | React Context + `useQuery` |
| `lib/api/account.ts` | `fetchSession()` centralizado |
| `lib/clientMeta.ts` | Genera `meta` del cliente |
| `lib/extractIp.ts` | Extrae la IP real desde headers (usado por `/api/auth/session`) |
| `types/sessions.ts` | Define `SessionContextResponse` |
| `app/api/auth/session/route.ts` | Proxy a `/account/me` con validación Zod y seguridad avanzada |

---

## 🔐 ¿Qué datos se exponen?

El hook `useSession()` retorna:

```ts
{
  user: { id, name, email, role, verified, avatar, ... },
  session: { id, device, ipAddress, expiresAt, ... },
  loading: boolean,
  refresh(): Promise<void>
}
```

---

## 🛡️ Seguridad

- La IP real del cliente se detecta automáticamente con `x-forwarded-for` y `x-real-ip`.
- Se bloquean IPs privadas en producción (`127.0.0.1`, `::1`, etc.).
- Se valida estrictamente el `meta` con Zod.
- Se propaga un `X-Request-ID` para trazabilidad entre frontend y backend.
- En producción no se exponen mensajes detallados de error (`msg` e `issues`).

---

## 🔁 Refetch manual (`refresh()`)

Desde cualquier componente:

```ts
const { refresh } = useSession();
await refresh(); // Refresca la sesión desde el backend
```

---

## 🧪 Ejemplo de uso

```tsx
"use client";
import { useSession } from "@/app/context/SessionContext";

export default function Dashboard() {
  const { user, session, loading } = useSession();

  if (loading) return <p>Cargando...</p>;
  if (!user) return <p>Acceso denegado</p>;

  return (
    <div>
      <h1>Bienvenido {user.name}</h1>
      <p>IP del dispositivo: {session.device.ipAddress}</p>
    </div>
  );
}
```

---

## 🧠 Tips adicionales

- Este contexto NO usa `localStorage` ni cookies del lado del cliente.
- Toda la sesión se valida 100% desde el backend.
- Ideal para apps seguras, trazables y con control de dispositivos.

---

## 🧼 Mantenimiento

- Si cambian los campos esperados en `/account/me`, actualizar `SessionContextResponse`.
- Si querés agregar más campos al `meta`, hacelo en `clientMeta.ts` y en el `MetaSchema` del endpoint proxy.

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Made with 🧠, 🥷, and 🫶