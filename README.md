# Symfony + DDD + TDD — Guía interactiva

Sitio Next.js que convierte la guía `guide.md` en 31 lecciones navegables, agrupadas en 9 módulos, con:

- Diagramas de arquitectura, flujos, árboles de carpetas y comparaciones renderizados en HTML/SVG (no ASCII art) a partir de bloques de código con lenguajes especiales (`flow`, `tree`, `compare`, `pyramid`, `architecture`) — ver `src/lib/diagrams.ts` y `src/components/CodeRenderer.tsx`.
- Un panel "Así va el proyecto hasta esta lección" que muestra el árbol de archivos acumulado del proyecto Symfony, resaltando qué archivos se agregan en cada lección (`src/lib/project-tree.ts`, `src/components/ProjectExplorer.tsx`). Los archivos que introduce cada lección se declaran en el frontmatter `newFiles` de `content/lessons/*.md`.
- Progreso de lectura persistido en `localStorage` (checklist por lección + barra de progreso global).
- Tema claro/oscuro con toggle manual y sin flash inicial.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Build de producción

```bash
npm run build
npm run start
```

## Editar contenido

Cada lección es un archivo Markdown en `content/lessons/NN-slug.md` con frontmatter:

```yaml
---
slug: "capa-de-dominio"
order: 7
module: "dominio"       # debe existir en src/lib/modules.ts
title: "Capa de Dominio"
summary: "..."
objectives:
  - "..."
newFiles:                # opcional: archivos que esta lección agrega al proyecto
  - "src/User/Domain/ValueObject/Email.php"
---
```

Bloques de diagrama disponibles dentro del Markdown:

- ` ```flow ` — pasos verticales conectados por flechas. Prefija una línea con `^` para invertir esa flecha (útil para representar puerto/adaptador).
- ` ```tree ` — árbol jerárquico por indentación (2 espacios por nivel). Primera línea opcional `!files` (iconos de carpeta/archivo) o `!flow` (cajas simples, por defecto).
- ` ```compare ` — columnas lado a lado, separadas por una línea `---`; cada columna admite un título con `# Título`.
- ` ```pyramid ` — pirámide de testing fija (sin contenido).
- ` ```architecture ` — mapa de arquitectura completo fijo (sin contenido).

## Desplegar en Vercel

1. Sube este directorio (`site/`) a un repositorio Git.
2. En Vercel: **New Project** → importa el repo → Framework se detecta automáticamente como **Next.js**.
3. Si el repo contiene más carpetas además de `site/`, configura **Root Directory** = `site` en la configuración del proyecto de Vercel.
4. Deploy — no requiere variables de entorno ni configuración adicional.

También puedes desplegar desde la CLI:

```bash
npm install -g vercel
vercel
```
