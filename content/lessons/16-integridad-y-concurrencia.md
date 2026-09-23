---
slug: "integridad-y-concurrencia"
order: 16
module: "concurrencia"
title: "Integridad y concurrencia"
summary: "Por qué findByEmail() no basta contra race conditions, cómo traducir un unique constraint violation, y qué es el optimistic locking."
objectives:
  - "Reconocer la race condition clásica de email duplicado entre dos requests concurrentes."
  - "Entender la regla: la aplicación valida para dar feedback, la base de datos protege la integridad."
  - "Diferenciar transacciones simples de un límite transaccional a nivel de Application."
  - "Explicar qué resuelve el Optimistic Locking en edición concurrente."
newFiles: []
---

### Race condition del email

```compare
# Request A
findByEmail
no existe
INSERT
---
# Request B
findByEmail
no existe
INSERT
```

Si solamente dependemos de `findByEmail()`, tenemos un problema: ambos requests pueden pasar la validación antes de que ninguno haya insertado nada. Por eso necesitamos `UNIQUE(email)` en la base de datos.

> La regla: la aplicación valida para dar feedback. La base de datos protege la integridad.

### Manejo de Unique Constraint

En producción, Doctrine puede lanzar una excepción de constraint. La infraestructura puede traducirla a una excepción de dominio/aplicación apropiada:

```flow
UniqueConstraintViolationException
UserEmailAlreadyExists
HTTP 409
```

No deberíamos exponer `SQLSTATE[23000]` al consumidor de la API.

### Transacciones

Actualmente `persist() + flush()` es suficiente para un CRUD sencillo. Pero imagina: `Create User + Create Profile + Create Audit + Publish Event`. Queremos:

```flow
BEGIN
Create User
Create Profile
Create Audit
COMMIT
```

Si algo falla: `ROLLBACK`.

### Application Transaction Boundary

Una operación de negocio puede definir una frontera transaccional:

```flow
Application Command
Transaction
Handler
Repositories
Commit
```

No necesariamente cada Repository debería decidir cuándo hacer `flush()`. En sistemas más complejos puede ser preferible que la transacción esté controlada por Application/Unit of Work.

### Optimistic Locking

```compare
# Cliente A
lee version 3
guarda version 4
---
# Cliente B
lee version 3
intenta guardar version 3 (conflicto)
```

Dos clientes leen la misma versión (`3`). El cliente A guarda primero y avanza a `version 4`. Cuando el cliente B intenta guardar basado en `version 3`, podemos detectar el conflicto. Esto se conoce como **Optimistic Locking**, y puede ser importante cuando hay edición concurrente sobre el mismo recurso.
