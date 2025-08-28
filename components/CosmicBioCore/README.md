# CosmicBioCore 🌌

Componente visual interactivo inspirado en una **medusa cósmica eléctrica**, con reactividad a la voz/micrófono.  
Usa **React + Three.js (@react-three/fiber)** y shaders personalizados (GLSL).

---

## ✨ Uso

```tsx
import dynamic from "next/dynamic";

const CosmicBioCore = dynamic(
  () => import("@/components/CosmicBioCore").then((m) => m.CosmicBioCore),
  { ssr: false, loading: () => null }
);

<CosmicBioCore
  status="connecting"        // "open" | "connecting" | "closed"
  onClick={() => console.log("Click")}
  quality="high"             // "low" | "med" | "high" | "ultra"
  useMic={false}             // activar mic interno (opcional)
  externalLevel={0.4}        // nivel externo (ej. capturado en tu página)
  className="mx-auto"
/>
```

---

## 📂 Estructura de archivos

```
CosmicBioCore/
├── CosmicBioCore.tsx        # Componente público (button + Canvas)
├── index.ts                 # Reexporta CosmicBioCore
└── core/
    ├── SceneRoot.tsx        # Escena con luces y capas
    ├── AuroraRibbon.tsx     # Cinta/tentáculo central (shader)
    ├── Sparks.tsx           # Partículas etéreas (shader)
    ├── shaders.ts           # GLSL shaders (Ribbon + Sparks)
    ├── statusParams.ts      # Colores/ritmo por estado
    ├── quality.ts           # Resoluciones por nivel de calidad
    ├── useMicLevel.ts       # Hook mic interno (RMS)
    ├── useAlive.ts          # Hook ciclo de vida (animación segura)
    ├── cleanupScene.ts      # Hook limpieza de recursos Three.js
    └── index.ts             # Reexporta todo lo de core/
```

---

## 🧩 Props principales

| Prop           | Tipo                                | Descripción |
|----------------|-------------------------------------|-------------|
| `status`       | `"open" \| "connecting" \| "closed"` | Estado visual principal (colores/animación). |
| `onClick`      | `() => void`                        | Handler al clickear el botón envolvente. |
| `quality`      | `"low" \| "med" \| "high" \| "ultra"` | Controla densidad de partículas y ribbon. |
| `useMic`       | `boolean`                           | Si `true`, activa mic interno para reactividad. |
| `externalLevel`| `number` (0..1)                     | Nivel de audio externo (tiene prioridad sobre `useMic`). |
| `className`    | `string`                            | Estilos extra para el wrapper. |

---

## 🚦 Ciclo de vida
- Monta al conectar (WebSocket u otra acción externa).  
- Activa micrófono si `useMic=true` o si recibe `externalLevel`.  
- Se desmonta limpiamente liberando geometrías, materiales y tracks de audio.  

---

## 🎨 Capas visuales
- **AuroraRibbon** → cinta eléctrica que responde a mic y estado.  
- **Sparks** → nube de partículas chispeantes con glow.  
- **SceneRoot** → monta ambas capas y configura luces/cámara.  

---

## 🔧 Notas técnicas
- Requiere contexto **HTTPS** o `localhost` para acceso al mic.  
- Usa `@react-three/fiber` + `three`.  
- Diseño pensado para UI/UX reactivo, no para un render 3D hiperrealista.  
