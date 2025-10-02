# Settings Page

Página de configuración profesional con arquitectura escalable y mejores prácticas.

## 📁 Estructura

```
app/settings/
├── page.tsx                      # Página principal con Tabs
├── components/
│   ├── ProfileTab.tsx           # Tab de perfil de usuario
│   ├── SessionsTab.tsx          # Tab de sesiones activas
│   └── SecurityTab.tsx          # Tab de seguridad
└── README.md

app/api/settings/
├── profile/
│   └── route.ts                 # PATCH - Actualizar perfil
├── sessions/
│   ├── route.ts                 # GET - Listar sesiones activas
│   ├── [sessionId]/route.ts     # DELETE - Revocar sesión específica
│   └── revoke-all/route.ts      # POST - Revocar todas las sesiones
└── security/
    └── password/route.ts        # POST - Cambiar contraseña

types/settings.ts                 # Types para Settings
```

## 🎯 Funcionalidades

### 1. Profile Tab
- **Editar perfil**: nombre, email, bio
- **Avatar**: visualización (upload pendiente)
- **Verificación**: badge de email verificado
- **Role**: display del rol del usuario
- **Metadata**: fecha de creación y última actualización
- **React Query**: mutations para updates
- **Validación**: form validation con feedback

### 2. Sessions Tab
- **Sesión actual**: destacada con badge
- **Otras sesiones**: listado de dispositivos activos
- **Device info**: OS, browser, IP, timezone, screen resolution
- **Iconos dinámicos**: desktop, mobile, tablet
- **Revocar sesión**: individual o todas a la vez
- **Auto-refresh**: cada 30 segundos
- **Timestamps**: formato relativo (2h ago, Just now, etc)

### 3. Security Tab
- **Cambiar contraseña**: formulario con validaciones
- **2FA**: preparado (disabled, coming soon)
- **Notificaciones**: alertas de seguridad (preparado)
- **Estado de seguridad**: indicadores visuales

## 🔌 API Routes (Templates)

Todas las rutas tienen:
- ✅ Comentarios `TODO` para conectar con backend
- ✅ Estructura de ejemplo comentada
- ✅ Mock responses para desarrollo
- ✅ Error handling
- ✅ Type safety

### Conectar con Backend

Reemplazar los bloques comentados en cada route:

```typescript
// En app/api/settings/profile/route.ts
const response = await fetch(`${process.env.BACKEND_URL}/users/profile`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Cookie": request.headers.get("cookie") || "",
  },
  body: JSON.stringify({ name, email, bio }),
});
```

## 🎨 UI/UX

- **Shadcn/ui**: componentes consistentes
- **Tailwind CSS**: utility-first
- **Responsive**: mobile-first design
- **Loading states**: skeletons y spinners
- **Toast notifications**: feedback inmediato (sonner)
- **Accessible**: ARIA labels, semantic HTML

## 📊 State Management

- **SessionContext**: datos del usuario desde context
- **React Query**: mutations y queries con cache
- **Local state**: formularios con useState
- **Auto-refresh**: queries con refetchInterval

## 🔒 Seguridad

- **Credentials**: `include` en todos los fetch
- **Validación**: client-side + backend
- **CSRF**: preparado para tokens
- **Password**: min 8 chars, match validation

## 🚀 Uso

### Acceso
- URL: `/settings`
- Requiere: sesión activa
- Desde: menú Sidebar → "Settings"

### Development
```bash
npm run dev
# Visita: http://localhost:3000/settings
```

### Datos Mock
Los API routes tienen mock data para desarrollo.
Remover cuando conectes con backend real.

## 📝 TODOs para Backend

1. **Profile Update** (`/api/settings/profile`)
   - Endpoint: `PATCH /users/profile`
   - Body: `{ name, email, bio }`
   - Response: updated user object

2. **Active Sessions** (`/api/settings/sessions`)
   - Endpoint: `GET /sessions/active`
   - Response: array de sesiones con device info

3. **Revoke Session** (`/api/settings/sessions/[id]`)
   - Endpoint: `DELETE /sessions/:id/revoke`
   - Response: confirmation

4. **Revoke All** (`/api/settings/sessions/revoke-all`)
   - Endpoint: `POST /sessions/revoke-all`
   - Response: { revokedCount: number }

5. **Change Password** (`/api/settings/security/password`)
   - Endpoint: `POST /users/password`
   - Body: `{ currentPassword, newPassword }`
   - Response: confirmation

## 🎯 Próximas Features

- [ ] Upload avatar
- [ ] Two-Factor Authentication (2FA)
- [ ] Login alerts configuration
- [ ] Activity log
- [ ] Export user data
- [ ] Delete account

## 📚 Referencias

- SessionContext: `app/context/SessionContext.tsx`
- Types: `types/settings.ts`, `types/sessions.ts`
- Shadcn/ui: `components/ui/`
