---
slug: "flujos-completos"
order: 25
module: "cierre"
title: "Flujos completos"
summary: "Trazamos de punta a punta el camino de un POST exitoso y de los tres errores más comunes: argumento inválido, not found y email duplicado."
objectives:
  - "Trazar mentalmente el camino completo de una request exitosa, capa por capa."
  - "Trazar los tres flujos de error más comunes hasta su código HTTP final."
newFiles: []
---

### Flujo completo de `POST /api/users`

Request:

```json
POST /api/users
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe"
}
```

Flujo:

```flow
HTTP
CreateUserController
CreateUserCommand
CreateUserHandler
```

Dentro del handler:

```tree
CreateUserHandler
  Email::fromString()
  UserRepository::findByEmail()
  User::create()
  UserRepository::save()
```

Y `save()` continúa hacia la infraestructura:

```flow
DoctrineUserRepository
Doctrine
MySQL
```

Respuesta:

```json
201 Created
{
  "id": "uuid"
}
```

### Flujo de error (argumento inválido)

```
GET /api/users/abc
```

El controller crea `new GetUserQuery('abc')`. El handler ejecuta `UserId::fromString('abc')`, que lanza `InvalidArgumentException`. Infrastructure lo traduce a `400 Bad Request`.

```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Invalid user ID."
  }
}
```

### Flujo de `UserNotFound`

```flow
GET /api/users/{uuid}
Controller
GetUserQuery
GetUserHandler
UserRepository
null
UserNotFound
ExceptionSubscriber
404
```

### Flujo de duplicate email

```flow
POST /api/users
CreateUserHandler
findByEmail
ya existe
UserEmailAlreadyExists
ExceptionSubscriber
409 Conflict
```

Y además, `MySQL → UNIQUE(email)` protege contra race conditions, tal como vimos en [integridad y concurrencia](/lecciones/integridad-y-concurrencia).
