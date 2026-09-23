---
slug: "ddd-mas-alla-del-crud"
order: 27
module: "cierre"
title: "DDD más allá del CRUD"
summary: "DDD no implica microservicios. Modular Monolith, cuándo extraer un microservicio, Domain Services y por qué el Shared Kernel debe ser pequeño."
objectives:
  - "Explicar por qué DDD y microservicios son decisiones independientes."
  - "Reconocer la forma de un Modular Monolith y cuándo vale la pena extraer un microservicio."
  - "Saber cuándo un Domain Service tiene sentido y cuándo se convierte en un 'Dios Service'."
newFiles: []
---

### ¿DDD implica microservicios?

No. Puedes tener:

```tree
!files
Monolith
  User
  Billing
  Orders
  Inventory
```

Cada módulo con `Domain`, `Application`, `Infrastructure`. Eso se conoce como **Modular Monolith**, y puede ser una excelente etapa antes de microservicios.

### Modular Monolith

```tree
!files
src
  User
    Domain
    Application
    Infrastructure
  Billing
    Domain
    Application
    Infrastructure
  Order
    Domain
    Application
    Infrastructure
```

Ventaja: límites claros, sin pagar inmediatamente el costo de network, deployment, distributed tracing, message broker, eventual consistency.

### ¿Cuándo extraer un microservicio?

No porque "microservicios están de moda", sino porque exista una razón. Por ejemplo, `Billing` podría requerir: despliegue independiente, escalamiento independiente, equipo independiente, seguridad independiente, ciclo de vida independiente.

> Primero crea límites buenos. Después decide si necesitas distribuirlos.

### Domain Service

Un Domain Service tiene sentido cuando una regla: pertenece al dominio, no pertenece naturalmente a una sola entidad, involucra varios objetos. Ejemplo: `UserRegistrationPolicy`.

Cuidado con convertir todo en `UserService`, porque termina siendo un "Dios Service".

### Shared Kernel

Shared debe ser pequeño. Puede contener `Shared/Domain` para conceptos realmente compartidos. No debería convertirse en:

```tree
!files
Shared
  Utils
  Helpers
  Misc
  Common
  Stuff
```

porque eso destruye los límites.
