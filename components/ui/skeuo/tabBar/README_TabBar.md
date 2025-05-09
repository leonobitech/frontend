# 📦 TabBar – Skeuomorphic Retro-UI

Este componente `TabBar` representa una barra de navegación inferior para interfaces móviles, diseñada con un estilo **skeuomorphic** realista y efectos de **iluminación retro-futurista**.

> Inspirado en botones físicos clásicos, con toques de realismo y una estética moderna de neón concavo.

---

## 📁 Estructura del componente

```txt
tabBar/
├── TabBar.tsx       ← Lógica del componente
├── TabBar.css       ← Estilos skeuomorphic + glow
├── menubar.json     ← Configuración dinámica de tabs
└── README.md        ← Documentación
```

---

## ⚙️ Construcción y comportamiento

- Usa `remixicon` para íconos vectoriales.
- Se detecta la ruta activa con `usePathname()` de Next.js.
- Cada ítem en el `menubar.json` define su:
  - `title` (texto)
  - `icon` (clase remixicon)
  - `path` (URL)
  - `glow` (color de retroiluminación)

---

## 🎨 Tabla de colores `glow`

| Color     | Clase usada           | Ejemplo visual |
|-----------|------------------------|----------------|
| Indigo    | `glow-indigo`          | `#818cf8 → #6366f1` |
| Violet    | `glow-violet`          | `#a78bfa → #8b5cf6` |
| Purple    | `glow-purple`          | `#c084fc → #a855f7` |
| Fuchsia   | `glow-fuchsia`         | `#e879f9 → #d946ef` |
| Pink      | `glow-pink`            | `#f472b6 → #ec4899` |

> Cada glow aplica tanto al icono (`text-shadow`) como al botón físico (`box-shadow` en `.back_indicator`), permitiendo personalización total por tab.

---

## 🧠 Detalles técnicos

- No se usa inline styling: todo está centralizado en `TabBar.css`.
- Iluminación constante, no animada (se puede reactivar el `@keyframes` si se desea).
- Soporta hasta 5 tabs, ideal para apps móviles con estructura fija.

---

## 🛠️ Cómo agregar un nuevo tab

1. Editá el archivo `menubar.json`.
2. Agregá una entrada con `title`, `icon`, `path`, y `glow`.

```json
{
  "title": "Nuevo",
  "icon": "ri-star-smile-line",
  "path": "/nuevo",
  "glow": "violet"
}
```

3. Asegurate de que `glow-<color>` esté definido en `TabBar.css`.

---

## ✅ Estado: Listo para producción

- 🔒 Totalmente accesible (sin inline styles)
- 🖥️ Preparado para SSR
- 🔁 Fácil de extender o refactorizar

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Made with 🧠, 🥷, and 🫶