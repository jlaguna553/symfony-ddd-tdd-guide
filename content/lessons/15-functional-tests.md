---
slug: "functional-tests"
order: 15
module: "http"
title: "Functional Tests"
summary: "Probamos el contrato HTTP de punta a punta con WebTestCase: creación, lectura, actualización, borrado y sus errores."
objectives:
  - "Escribir un Functional Test completo con WebTestCase contra el endpoint de creación."
  - "Cubrir la matriz completa de casos felices y de error para los cinco endpoints."
  - "Aplicar el ciclo TDD también a nivel de Controllers, guiando el contrato HTTP con tests."
newFiles:
  - "tests/Functional/User/CreateUserControllerTest.php"
  - "tests/Functional/User/ListUsersControllerTest.php"
  - "tests/Functional/User/GetUserControllerTest.php"
  - "tests/Functional/User/UpdateUserControllerTest.php"
  - "tests/Functional/User/DeleteUserControllerTest.php"
---

### Ejemplo base

`tests/Functional/User/CreateUserControllerTest.php`

```php
<?php

namespace App\Tests\Functional\User;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class CreateUserControllerTest extends WebTestCase
{
    public function testItCreatesAUser(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/users',
            server: [
                'CONTENT_TYPE' => 'application/json',
            ],
            content: json_encode([
                'email' => 'john@example.com',
                'name' => 'John Doe',
            ])
        );

        self::assertResponseStatusCodeSame(201);

        $body = json_decode(
            $client->getResponse()->getContent(),
            true
        );

        self::assertArrayHasKey('id', $body);
    }
}
```

### Casos adicionales

**Duplicate email**: `POST user` → `POST same email` → `201` seguido de `409`. Comprueba el flujo completo:

```flow
HTTP
Controller
Handler
Repository
MySQL
constraint / domain rule
Exception
Subscriber
409
```

**GET**: `POST → 201`, luego `GET /api/users/{id} → 200`, verificando:

```json
{
  "id": "...",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Not found**: `GET /api/users/{uuid-inexistente}` → `404` con:

```json
{
  "error": {
    "code": "USER_NOT_FOUND"
  }
}
```

**Invalid ID**: `GET /api/users/not-a-uuid` → `400` porque la entrada no tiene formato válido.

**Update**: `PUT /api/users/{id}` con `{"email": "new@example.com", "name": "New Name"}` → `204`. Después un `GET` confirma que realmente cambió.

**Delete**: `DELETE /api/users/{id}` → `204`. Después `GET /api/users/{id}` → `404`.

### Matriz completa de Functional Tests

**POST**
- 201 valid user
- 400 invalid JSON
- 400 invalid payload
- 422 invalid email
- 422 invalid name
- 409 duplicate email

**GET collection**
- 200 empty
- 200 multiple users

**GET item**
- 200 existing
- 404 missing
- 400 invalid ID

**PUT**
- 204 valid
- 400 invalid ID
- 400 invalid JSON
- 404 missing
- 409 duplicate email
- 422 invalid domain data

**DELETE**
- 204 existing
- 404 missing
- 400 invalid ID

### TDD para Controllers

Orden ideal:

```flow
Functional Test
RED
Controller mínimo
Application Handler
Repository
MySQL
GREEN
REFACTOR
```

Así también el contrato HTTP está guiado por tests, igual que hicimos con el dominio y la aplicación.
