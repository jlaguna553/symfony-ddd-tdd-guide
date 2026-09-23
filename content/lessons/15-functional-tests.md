---
slug: "functional-tests"
order: 15
module: "http"
title: "Functional Tests"
summary: "Completamos la batería de Functional Tests: email duplicado, la solución al ejercicio de GET, y los tests de update y delete que faltaban."
objectives:
  - "Ver la solución al ejercicio de GET propuesto en la lección anterior."
  - "Escribir el test de email duplicado como un segundo método sobre el test que ya existe, no un archivo nuevo."
  - "Cubrir PUT y DELETE con Functional Tests completos, incluyendo la verificación posterior con GET."
  - "Usar la matriz completa como checklist para los casos que quedan como ejercicio."
newFiles:
  - "tests/Functional/User/GetUserControllerTest.php"
  - "tests/Functional/User/ListUsersControllerTest.php"
  - "tests/Functional/User/UpdateUserControllerTest.php"
  - "tests/Functional/User/DeleteUserControllerTest.php"
---

Si hiciste el ejercicio de la lección anterior, ya tienes un `CreateUserControllerTest` con un método y quizás un `GetUserControllerTest` propio. Aquí completamos lo que falta — comparando contra la solución donde corresponda.

### Duplicate email: un método más, no un archivo más

Este caso no necesita un test nuevo — necesita un **segundo método** en la clase `CreateUserControllerTest` que ya escribiste en la lección de [Controllers](/lecciones/controllers-http):

```php
public function testItRejectsADuplicateEmail(): void
{
    $client = static::createClient();

    $payload = json_encode([
        'email' => 'john@example.com',
        'name' => 'John Doe',
    ]);

    $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: $payload);
    self::assertResponseStatusCodeSame(201);

    $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: $payload);
    self::assertResponseStatusCodeSame(409);
}
```

Corre `php bin/phpunit tests/Functional/User/CreateUserControllerTest.php`. Si todavía no hiciste el ejercicio de excepciones específicas de la lección de [manejo de errores](/lecciones/manejo-de-errores), este test falla: recibirás `422`, no `409`, porque `CreateUserHandler` lanza un `\DomainException` genérico y el subscriber lo mapea a `422`. Ese es tu RED. Aplica el cambio de esa lección (`UserEmailAlreadyExists` + su branch específico en el subscriber, mapeado a `409` y evaluado antes que el genérico) y vuelve a correr el test — ahora sí, `409` real. Este test comprueba el flujo completo:

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

### GetUserController — la solución al ejercicio

`tests/Functional/User/GetUserControllerTest.php`

```php
<?php

namespace App\Tests\Functional\User;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class GetUserControllerTest extends WebTestCase
{
    public function testItReturnsAnExistingUser(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]));

        $id = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('GET', "/api/users/{$id}");

        self::assertResponseStatusCodeSame(200);

        $body = json_decode($client->getResponse()->getContent(), true);

        self::assertSame('john@example.com', $body['email']);
        self::assertSame('John Doe', $body['name']);
    }

    public function testItReturns404ForAMissingUser(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/users/' . \Symfony\Component\Uid\Uuid::v4());

        self::assertResponseStatusCodeSame(404);

        $body = json_decode($client->getResponse()->getContent(), true);

        self::assertSame('USER_NOT_FOUND', $body['error']['code']);
    }

    public function testItReturns400ForAnInvalidId(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/users/not-a-uuid');

        self::assertResponseStatusCodeSame(400);
    }
}
```

Si tu versión del ejercicio cubre los mismos tres casos con otros nombres de método, está bien — lo que importa es que los tres códigos de estado (200, 404, 400) queden probados contra el servidor real, no solo contra el Handler.

### ListUsersController

`tests/Functional/User/ListUsersControllerTest.php`

```php
<?php

namespace App\Tests\Functional\User;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class ListUsersControllerTest extends WebTestCase
{
    public function testItReturnsAnEmptyArrayWhenThereAreNoUsers(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/users');

        self::assertResponseStatusCodeSame(200);
        self::assertSame([], json_decode($client->getResponse()->getContent(), true));
    }

    public function testItReturnsAllCreatedUsers(): void
    {
        $client = static::createClient();

        foreach (['a@example.com', 'b@example.com'] as $email) {
            $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
                'email' => $email,
                'name' => 'Someone',
            ]));
        }

        $client->request('GET', '/api/users');

        self::assertCount(2, json_decode($client->getResponse()->getContent(), true));
    }
}
```

### UpdateUserController

`tests/Functional/User/UpdateUserControllerTest.php`

```php
<?php

namespace App\Tests\Functional\User;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class UpdateUserControllerTest extends WebTestCase
{
    public function testItUpdatesAnExistingUser(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]));

        $id = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('PUT', "/api/users/{$id}", server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'new@example.com',
            'name' => 'New Name',
        ]));

        self::assertResponseStatusCodeSame(204);

        $client->request('GET', "/api/users/{$id}");

        $body = json_decode($client->getResponse()->getContent(), true);

        self::assertSame('new@example.com', $body['email']);
        self::assertSame('New Name', $body['name']);
    }

    public function testItReturns404WhenUpdatingAMissingUser(): void
    {
        $client = static::createClient();

        $client->request('PUT', '/api/users/' . \Symfony\Component\Uid\Uuid::v4(), server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'new@example.com',
            'name' => 'New Name',
        ]));

        self::assertResponseStatusCodeSame(404);
    }
}
```

Fíjate en el patrón del primer test: **no confiamos en que el `PUT` haya funcionado solo porque devolvió `204`.** Hacemos un `GET` después para comprobar que el cambio realmente se persistió. Un `204` es solo "acepté la petición" — la única prueba real de que la actualización llegó a MySQL es leerla de vuelta.

### DeleteUserController

`tests/Functional/User/DeleteUserControllerTest.php`

```php
<?php

namespace App\Tests\Functional\User;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class DeleteUserControllerTest extends WebTestCase
{
    public function testItDeletesAnExistingUser(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/users', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]));

        $id = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('DELETE', "/api/users/{$id}");
        self::assertResponseStatusCodeSame(204);

        $client->request('GET', "/api/users/{$id}");
        self::assertResponseStatusCodeSame(404);
    }

    public function testItReturns404WhenDeletingAMissingUser(): void
    {
        $client = static::createClient();

        $client->request('DELETE', '/api/users/' . \Symfony\Component\Uid\Uuid::v4());

        self::assertResponseStatusCodeSame(404);
    }
}
```

Mismo principio que en `Update`: el `DELETE` se confirma con un `GET` posterior que debe devolver `404`.

### El resto queda como ejercicio

Ya escribiste el patrón para los cinco endpoints. La matriz completa de abajo es tu checklist — los casos que no tienen código en esta lección (`400 invalid JSON`, `422 invalid email`, `422 invalid name`, `400 invalid ID` en `PUT`/`DELETE`) siguen exactamente el mismo patrón que ya usaste: arma el request, verifica el código de estado, y cuando aplique, verifica el contrato de error con `$body['error']['code']`.

**POST**
- 201 valid user ✓ (lección 13)
- 400 invalid JSON
- 400 invalid payload
- 422 invalid email
- 422 invalid name
- 409 duplicate email ✓

**GET collection**
- 200 empty ✓
- 200 multiple users ✓

**GET item**
- 200 existing ✓
- 404 missing ✓
- 400 invalid ID ✓

**PUT**
- 204 valid ✓
- 400 invalid ID
- 400 invalid JSON
- 404 missing ✓
- 409 duplicate email
- 422 invalid domain data

**DELETE**
- 204 existing ✓
- 404 missing ✓
- 400 invalid ID

> **✏️ Ejercicio —** Implementa al menos los tres casos `422` que quedaron sin marcar. Vas a necesitar que `CreateUserHandler` deje escapar el `\InvalidArgumentException` que lanza `Email::fromString()` o `User::create()` — y que `ApiExceptionSubscriber` ya sepa traducirlo a 400, no a 422 (revisa la tabla de la lección de errores: en la implementación actual, `InvalidArgumentException` mapea a 400, no a 422). Si quieres que la validación de dominio dé 422 en vez de 400, ese es exactamente el problema que resuelve la sección "Mejora: excepciones específicas" de la lección anterior — es un buen momento para volver y aplicarlo de verdad, creando `InvalidEmail` e `InvalidUserName` como excepciones propias.

### TDD para Controllers, en retrospectiva

El orden que seguiste en esta lección y la anterior fue:

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

Así también el contrato HTTP quedó guiado por tests, igual que el dominio y la aplicación.
