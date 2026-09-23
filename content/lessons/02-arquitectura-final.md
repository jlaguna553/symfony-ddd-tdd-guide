---
slug: "arquitectura-final"
order: 2
module: "fundamentos"
title: "Arquitectura final"
summary: "La dirección de dependencias que vamos a respetar en todo el proyecto: de HTTP hacia el dominio, nunca al revés."
objectives:
  - "Visualizar la dirección de dependencias entre HTTP, Infrastructure, Application y Domain."
  - "Entender el patrón Puerto/Adaptador para la persistencia."
  - "Tener el mapa completo de la arquitectura como referencia visual para el resto de la guía."
newFiles: []
---

La dirección de dependencias será:

```flow
HTTP
Infrastructure
Application
Domain
```

Y para persistencia, el dominio define el puerto y la infraestructura provee el adaptador:

```flow
Application
Domain Repository Interface
^Infrastructure Repository
Doctrine
MySQL
```

Fíjate en la flecha invertida: `Infrastructure Repository` apunta *hacia arriba*, hacia la interfaz del dominio, no al revés. Este es el nombre técnico de lo que venimos haciendo: **Dependency Inversion Principle** (la "D" de SOLID). La regla no es "el código de bajo nivel no debe tener dependencias" — Doctrine sigue siendo una dependencia real. La regla es que la *interfaz* la define quien la necesita (el dominio), no quien la implementa (la infraestructura). Eso es lo que se "invierte": normalmente pensarías que el módulo de alto nivel depende del de bajo nivel; aquí es al revés, el de bajo nivel depende de una abstracción que pertenece al de alto nivel.

Una forma de visualizar todo el sistema junto — controllers, commands/queries, handlers, el dominio con su entidad y value objects, y cómo la infraestructura implementa el puerto de persistencia hasta llegar a MySQL:

```architecture
```

Vas a ver este mismo mapa reaparecer al final de la guía, cuando ya tengas cada pieza implementada y puedas leerlo con otros ojos.
