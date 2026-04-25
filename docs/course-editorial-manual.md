# Manual Editorial — Cursos Leonobitech

**Propósito**: definir el lenguaje editorial y estructural de los cursos del sitio para que cada paso, cada paso de cada curso futuro, y cada landing tengan **consistencia visual y narrativa**. Este manual es la fuente de verdad. Si algo del MDX o del componente entra en conflicto con lo escrito acá, gana este documento.

Inspiración: Stripe Docs, MDN Web Docs, Linear Docs, The Rust Book, Anthropic Documentation. Voz: editorial-técnica, neutra (español castellano internacional, sin voseo regional), con anglicismos técnicos cuando aportan precisión (`borrow`, `deploy`, `runtime`, `panic`, `watchdog`).

---

## 1. Estructura jerárquica de un paso

Cada paso de cada curso tiene **una y solo una** estructura jerárquica:

```
H1 — Título del paso (renderizado por <StepHero>, NO en MDX)
  H2 — Sección principal (3 a 8 por paso, máximo)
    H3 — Subsección (0 a 6 por H2)
```

### Reglas inviolables

1. **Un solo H1 por paso**, y vive en el componente `<StepHero>`. El MDX nunca contiene `# Título`.
2. **No hay H4, H5, H6**. Si un H3 necesita subdivisiones, usar lista con descripciones (`<dl>` semántico o `<ol>` con bold).
3. **No hay H3 huérfano** — cada H3 vive bajo un H2. Si aparece un H3 sin H2 padre, se promueve a H2 o se elimina la subsección.
4. **El H2 introduce un cambio narrativo grande** — un nuevo archivo, un nuevo concepto, una nueva fase del firmware.
5. **El H3 sirve para subdividir un H2 muy denso**. Si un H2 tiene 1 solo H3, mejor convertir el H3 en un párrafo en bold inline.
6. **Los headings no llevan emojis**. Nunca. Ver §4.

### Anti-patrón a corregir

```markdown
## 🛠️ Prerrequisitos — Instalación del entorno     ← MAL: emoji en heading
### 1. Rust (nightly)                              ← MAL: numeración en heading
```

→ Forma correcta:

```markdown
## Prerrequisitos                                   ← Sección
### Rust nightly                                    ← Subsección, sin numeración
```

La numeración la maneja el TOC, no el texto del heading.

---

## 2. TOC (tabla de contenidos)

El TOC es **la espina dorsal navegacional** del paso. Si el TOC se ve caótico, el paso está mal estructurado.

### Comportamiento esperado

- Muestra **H2 prominente + H3 indentado** (jerarquía visual clara).
- El active state sigue el scroll con un solo elemento marcado a la vez (sin saltos).
- **Si hay más de 25 ítems totales (H2 + H3)**, el paso está sobre-segmentado y debe consolidarse.
- En desktop, el TOC vive sticky en el lado derecho. En mobile, **no se muestra** (el lector recorre linealmente).

### Reglas

1. **El componente TOC no muestra emojis**, aunque el heading los tenga (cosa que no debería pasar — ver §4).
2. El active state se calcula con `IntersectionObserver` con `rootMargin` ajustado al `course-scroll-container`.
3. Cada H2 cabe en una línea (máximo 50 caracteres del título). Si no cabe, el heading es muy largo y se acorta.

---

## 3. Callouts — uso y tipos

Los callouts son interrupciones tipográficas para destacar **algo que el lector NO debe pasar por alto**. Son caros — usados en exceso pierden eficacia y satuan la página.

### Tipos permitidos (solo 2)

1. **`info`** (default): aporta contexto, profundiza, da background. Estilo neutro con accent line vertical en `--course-accent`. Icono opcional `<Info>` (lucide).
2. **`warning`**: alerta, error común a evitar, gotcha de seguridad o producción. Estilo más prominente con accent line en color amber/yellow del sistema. Icono `<AlertTriangle>` (lucide).

### Tipos prohibidos

- ❌ `success`, `error`, `tip`, `note`, `quote`, `default`. Se mapean a `info` o `warning`.
- ❌ Variantes de color (red, blue, green, purple, etc.) — colapsadas a las 2 anteriores en §3.
- ❌ Emojis como marker (🎯 💡 ⚠️ 🔒 🔁 🧭 🏔️). Reemplazados por iconos lucide.

### Reglas

1. **Máximo 6 callouts por paso**. Si tu paso tiene 30, casi todos son ruido. Convertí la mayoría a párrafos con bold + accent line (variante "inline emphasis").
2. **Nunca callout dentro de callout**. Aplanar siempre.
3. **Un callout = una idea**. Si el cuerpo del callout tiene 5 párrafos, no es un callout, es una sección. Convertir a H3 o subsection.
4. **El callout NO duplica info que está en el párrafo anterior**. Es nueva información o resumen aspiracional.

### Anti-patrón

```mdx
<Callout icon="🎯" color="blue">
  Usamos `Arc<Mutex<T>>` para shared state.
</Callout>
```

→ Forma correcta (cuando no es realmente importante):

```markdown
**Patrón clave**: usamos `Arc<Mutex<T>>` para shared state.
```

→ Forma correcta (cuando SÍ amerita callout):

```mdx
<Callout type="warning">
  No envolver `Arc<Mutex<T>>` en otro `Mutex` — el deadlock es inmediato y el watchdog reinicia el chip en 30s.
</Callout>
```

---

## 4. Emojis — prohibidos como decorativos

Los emojis comunican **emoción**, no información técnica. En docs técnicas profesionales son ruido visual.

### Prohibido

- ❌ Emojis en headings (`## 🎯 Tesis del módulo`)
- ❌ Emojis como bullet (`- 🔧 Configurar Cargo.toml`)
- ❌ Emojis en callouts como marker (`<Callout icon="💡">`)
- ❌ Emojis en frontmatter del MDX

### Permitido (raro)

- ✅ Emoji en código si **es la sintaxis real** del programa (`println!("✓ done")` en un ejemplo).
- ✅ Emoji en una cita literal de un mensaje de error real del compilador o de un repo público.

### Sustitución

| Emoji en Notion | Reemplazo en docs |
|-----------------|-------------------|
| 🛠️ 🎯 💡 🔁 🧭 🏔️ | quitar, sin reemplazo |
| ⚠️ 🚨 🔥 🔒 | `<Callout type="warning">` con icono lucide |
| ✅ ✔ | `<Callout type="info">` con icono lucide |
| 🔧 ⚙️ | quitar (es ruido en docs tech) |

---

## 5. Listas — anidación, no texto plano

El instinto de Notion es escribir párrafos. El instinto de docs tech es **estructurar cuando hay enumeración**.

### Cuándo usar lista

1. **Tres o más ítems homogéneos** → `<ol>` o `<ul>`.
2. **Pasos secuenciales** → `<ol>` numerada.
3. **Términos con definición** → `<dl>` (term/description) si hay 2+. Si es 1 solo, mejor inline con bold.
4. **Sub-bullets**: máximo 2 niveles. Tres niveles indica que la organización está mal — refactorizar a sub-secciones.

### Cuándo NO usar lista

- ❌ Una sola "razón" en una lista.
- ❌ Lista de 1 ítem.
- ❌ Bullets cuando el contenido fluye narrativamente. Una lista con 3 items extensos es difícil de leer; mejor 3 párrafos con transiciones.

### Anti-patrón a corregir (típico de Notion)

```markdown
Tres razones:

1. **Consistencia** — Otros periféricos sí pueden fallar.
2. **Safety** — Si la implementación cambiara, el error sería posible.
3. **Filosofía Rust** — Mejor un `?` extra que un crash silencioso.
```

Esto es **correcto** y debe preservarse — es exactamente cómo se leen mejor.

Pero esto:

```markdown
Existen `urlencoding` y `percent-encoding`, pero agregar un crate para 15 líneas no vale la pena. Más binario en flash limitada. Más superficie de bugs. Más tiempo de compilación.
```

→ se beneficia de convertirse a:

```markdown
Existen `urlencoding` y `percent-encoding`, pero agregar un crate para 15 líneas no vale la pena:

- **Más binario** en flash limitada.
- **Más superficie de bugs** que mantener.
- **Más tiempo de compilación** en cada change.
```

---

## 6. Code blocks

Detalladamente bien resuelto en componentes (chip de lenguaje + copy + filename). Reglas editoriales:

1. **Todo bloque de código tiene lenguaje declarado** — `rust`, `bash`, `toml`, `text`, `json`. Nunca un bloque sin language. Si Notion exporta como `javascript` por default, el sanitizer detecta diagramas ASCII y los normaliza a `text`.
2. **Filename como caption** cuando el código pertenece a un archivo específico: usar el feature de rehype-pretty-code (`/// filename`).
3. **Diagramas ASCII** en lenguaje `text` (no `javascript`, `js`, ni nada que dispare syntax highlighting). El chip de lenguaje no se muestra para `text`.
4. **Inline code** (`` `código` ``) se usa para identificadores Rust (`Result<T>`), nombres de archivo (`Cargo.toml`), commandos (`cargo build`), constantes y tipos. Nunca para énfasis (eso es bold).

---

## 7. Tablas

1. **Tablas siempre tienen header** con `| **Columna** | **Columna** |`.
2. **Si una tabla tiene 1 columna, no es tabla**, es una lista.
3. **Si una tabla tiene 2 columnas y la segunda es prosa larga, no es tabla**, es `<dl>` (term/description).
4. Las celdas no tienen párrafos enteros — solo datos puntuales.

---

## 8. Tipografía y voz

### Voz

- **Español neutro/castellano internacional**. Sin voseo (Argentina), sin "vosotros" (España), sin lunfardo. Usar tuteo (`tú`).
- **Anglicismos técnicos preservados**: `borrow`, `deploy`, `runtime`, `crash`, `lock`, `thread`, `embed`, `fix`, `commit`, `push`, `merge`, `panic`, `watchdog`, `firmware`.
- **Tono**: didáctico-técnico, no formal-académico ni casual-blog. Modelo: Rust Book traducido al español.
- **Persona**: hablar al lector en **tú** ("aprendes", "construyes", "verás"). Nunca "yo" ni "nosotros". Nunca "uno".

### Display

- **Display font** (H1, H2, hero): `Fraunces` (serif moderno con carácter editorial).
- **Body font**: `Inter` (sans-serif técnico claro).
- **Mono font**: `JetBrains Mono`.

### Tamaños relativos

- H1 hero: 56–72px (responsive)
- H2 sección: 32–40px (responsive)
- H3 subsección: 20–22px
- Body: 16–17px
- Inline code: 0.9em del body

### Medida de lectura

- Párrafos, listas, headings: max-width `74ch` (~700px) para comfort de lectura.
- Code blocks, tablas, callouts: full-bleed (toman todo el ancho del article).

---

## 9. Layout del paso (resumen)

| Viewport | Sidebar | TOC | Centro |
|----------|---------|-----|--------|
| <1024 (mobile/tablet) | oculto | oculto | full |
| 1024–1279 (tablet/laptop chica) | 240px | oculto | flex-1 |
| 1280+ (laptop/desktop) | 240px | 288px | flex-1 |

- **Scroll**: solo el centro scrollea. Las dos sidebars son `position: static` (no sticky), evitando jitter.
- **Container externo**: `max-w-[110rem]` (1760px) para que en monitores grandes no se estire indefinidamente.
- **Padding del centro**: `py-14 md:py-20 pb-8 md:pb-10`.

---

## 10. Pipeline de sanitización del MDX

Cada vez que se importa contenido nuevo desde Notion (o se edita a mano un MDX), se aplica:

1. `voseoToTuteo` — voseo rioplatense → tuteo neutral.
2. `sanitizeMdx` — generics Rust (`Option<T>`, `Arc<Mutex<T>>`) entre backticks, escapar `<=`/`>=`, fixear bold mal cerrado adyacente a inline code, normalizar diagramas ASCII a `text`.
3. `cleanupQuestionnaireSeparators` — quitar `---` redundantes entre preguntas del cuestionario.
4. `stripFakeNotionLinks` — quitar auto-links a dominios externos squatters (`http://main.rs/`, `http://wifi.rs/`, etc.).
5. **(NUEVO)** `stripDecorativeEmojis` — quitar emojis en headings, bullets, callouts y prosa narrativa. Preservar emojis dentro de code blocks.
6. **(NUEVO)** `flattenNestedCallouts` — detectar `<Callout>` dentro de `<Callout>` y aplanar.
7. **(NUEVO)** `normalizeCalloutTypes` — colapsar 8 colores a `info` y `warning`.
8. **(NUEVO)** `normalizeHeadingHierarchy` — corregir saltos H1→H3, eliminar H1 duplicados (el StepHero ya tiene 1).

---

## Checklist de revisión por paso

Antes de publicar un paso, verificar:

- [ ] Un solo H1, en `<StepHero>`. Cero H1 en MDX.
- [ ] Cero emojis en headings.
- [ ] Cero callouts anidados.
- [ ] Máximo 6 callouts en total (info y warning son los únicos tipos).
- [ ] Cada H3 tiene un H2 padre.
- [ ] Cada code block tiene lenguaje declarado.
- [ ] Cero auto-links a dominios externos no oficiales.
- [ ] El TOC tiene < 25 ítems totales.
- [ ] Voz tú-tuteo neutral, sin voseo.
- [ ] Listas usadas cuando hay enumeración real (no narrativa).
- [ ] Tablas con header y datos puntuales.
