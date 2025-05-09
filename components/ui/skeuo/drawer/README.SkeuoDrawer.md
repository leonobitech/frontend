# 🧰 SkeuoDrawer – Sistema de Vistas Anidadas

Este componente representa un **drawer lateral skeuomorphic** con capacidad para manejar múltiples niveles de vista (`root`, `level1`, `level2`) de forma fluida y reusable. Ideal para navegación compleja, configuraciones o menús móviles jerárquicos.

---

## 📁 Estructura de Archivos

```
/components/ui/skeuo/drawer/
├── SkeuoDrawer.tsx        # Componente principal que controla el flujo de vistas
├── DrawerRoot.tsx         # Vista raíz del drawer
├── DrawerView.tsx         # Vista anidada reutilizable
├── SkeuoDrawer.css        # Estilos skeuomorphic globales del drawer
```

---

## 🧠 Lógica de Navegación

- Se maneja un estado `view` con valores posibles:
  - `"root"` → Vista inicial
  - `"level1"` → Submenú 1
  - `"level2"` → Submenú 2
- Se puede navegar adelante o atrás mediante callbacks (`onNext`, `onBack`).
- El drawer aplica animaciones condicionales para simular profundidad y transición lateral suave entre vistas.

---

## 💡 Cómo Extender

Para agregar nuevas vistas:
1. Crea un nuevo componente tipo `DrawerView.tsx` con tu contenido.
2. Agrega una nueva condición en el render de `SkeuoDrawer.tsx` como:
```tsx
{view === "level3" && <DrawerLevel3 onBack={() => setView("level2")} />}
```
3. Usa el patrón `onBack` / `onNext` para controlar la navegación.

---

## 🎨 Estilo Skeuomorphic

El diseño visual sigue una estética física realista:
- Gradientes suaves
- Bordes internos
- Sombras profundas
- Transiciones con `ease-in-out`

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Made with 🧠, 🥷, and 🫶
