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

Una forma de visualizar todo el sistema junto — controllers, commands/queries, handlers, el dominio con su entidad y value objects, y cómo la infraestructura implementa el puerto de persistencia hasta llegar a MySQL:

```architecture
```

Vas a ver este mismo mapa reaparecer al final de la guía, cuando ya tengas cada pieza implementada y puedas leerlo con otros ojos.
