# 🛡️ Seguridad de Autenticación – Leonobitech App

Este documento describe la arquitectura de seguridad aplicada al sistema de autenticación de la aplicación Leonobitech, incluyendo cookies httpOnly, Redis, fingerprint, middleware y validación profunda de tokens.

---

## 🧱 Capas de seguridad

La autenticación se implementa en múltiples niveles, cada uno con responsabilidades claras:

| Capa                  | Propósito                                                  | Corre en           | Validación profunda  |
|-----------------------|------------------------------------------------------------|--------------------|----------------------|
| `middleware.ts`       | Bloqueo superficial de rutas públicas si hay cookies       | Edge / App Router  | ❌                   |
| `SessionProvider`     | Estado global de sesión vía React Query                    | Cliente (React)    | ✅ (via API)         |
| `/api/auth/session`   | Proxy seguro con meta y cookies hacia backend real         | API Route          | ✅                   |
| `backend /account/me` | Validación real: Redis, fingerprint, expiración, revocado  | Backend Core       | ✅ 🔐                |

---

## 🍪 Cookies utilizadas

| Nombre      | Propósito                                  | Tipo     | Seguridad                       |
|-------------|----------------------------------------- --|----------|---------------------------------|
| `accessKey` | Identificador (`jti`) del access token     | httpOnly | `secure`, `sameSite=strict`     |
| `clientKey` | Hash del fingerprint del dispositivo       | httpOnly | `secure`, `sameSite=strict`     |

> Las cookies nunca contienen tokens. Se usan como claves para lookup seguro en Redis y fingerprint.

---

## 🧠 Middleware (bloqueo superficial)

El archivo `middleware.ts` intercepta las rutas públicas `/login`, `/register`, `/verify-email` si existen cookies activas, y redirige al dashboard sin validar el token.

```ts
if (accessKey && clientKey && isPublicRoute(path)) {
  redirect("/dashboard");
}
```

No consume Redis ni verifica JWT. Previene render innecesario de páginas públicas para usuarios ya autenticados.

---

## 🔐 Validación profunda del backend

1. Se recibe `accessKey` (hashed `jti`) y `clientKey` (fingerprint).
2. Se busca el token en Redis.
3. Se verifica firma JWT, expiración, `aud`, `sub`, etc.
4. Se reconstruye el fingerprint desde `meta`.
5. Se compara con `clientKey` y datos originales del token.
6. Si coincide → sesión válida. Si no → `401 Unauthorized`.

---

## 🔁 Refresh automático de tokens

Cuando el access token no está en Redis:

- El middleware `authenticate` del backend detecta su ausencia.
- Busca el refresh token persistido en la base de datos mediante `clientKey`.
- Valida fingerprint nuevamente.
- Si todo es válido, se generan nuevos tokens.
- Se actualizan cookies con nuevos `accessKey` y `clientKey`.

---

## 📤 Metadata (`meta`) enviada desde el cliente

Incluye:

```ts
{
  deviceInfo: { device, os, browser },
  userAgent,
  language,
  platform,
  timezone,
  screenResolution,
  label
}
```

Se usa para:
- Regenerar el fingerprint (`clientKey`)
- Detectar cambios sospechosos en el dispositivo
- Vincular dispositivos únicos por usuario

---

## 🚫 Protección de IPs en producción

En el endpoint `/api/auth/session` se bloquean IPs privadas:

- `127.0.0.1`, `::1`, `10.x.x.x`, `192.168.x.x`, etc.
- Previene falsificación local desde entornos no autorizados
- Se puede deshabilitar en entorno de desarrollo

---

## 📚 Logging y auditoría

- Cada request incluye un `X-Request-ID` único para trazabilidad.
- Se loguean eventos críticos: fingerprint inválido, IP sospechosa, sesión inválida.
- Se integran logs con consola, archivos o base de datos de eventos.

---

## ✅ Buenas prácticas aplicadas

- Cookies httpOnly sin exponer tokens al cliente
- Redis TTL para access tokens (auto-expiración real)
- Validación cruzada con fingerprint + metadata
- Middleware de bloqueo preventivo sin costo de validación
- Proxy centralizado (`/api/auth/session`) para control completo
- Backend único de verdad (`/account/me`)

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Auditoría. Trazabilidad. Seguridad real.
