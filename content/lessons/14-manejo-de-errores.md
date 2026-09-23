---
slug: "manejo-de-errores"
order: 14
module: "http"
title: "Manejo de errores"
summary: "Un ApiExceptionSubscriber centralizado que traduce excepciones de dominio a un contrato HTTP de errores estable."
objectives:
  - "Mapear excepciones de dominio a códigos HTTP concretos (400, 404, 409, 422, 500)."
  - "Centralizar esa traducción en un Exception Subscriber en vez de try/catch por controller."
  - "Diseñar un contrato de error JSON consistente y estable para el frontend."
newFiles:
  - "src/User/Infrastructure/Http/Exception/ApiExceptionSubscriber.php"
  - "src/User/Domain/Exception/UserEmailAlreadyExists.php"
---

### Códigos HTTP

Necesitamos distinguir:

- 400 Bad Request
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 500 Internal Server Error

| Situación | Código |
|---|---|
| JSON inválido | 400 |
| UUID inválido | 400 |
| UserNotFound | 404 |
| Email duplicado | 409 |
| Regla de dominio | 422 |
| Error inesperado | 500 |

### ¿Por qué no devolver excepciones directamente?

Porque `DomainException` no es un contrato HTTP. La capa HTTP debe traducir `Domain → HTTP`. Por ejemplo: `UserNotFound → 404`.

### Exception Subscriber

`src/User/Infrastructure/Http/Exception/ApiExceptionSubscriber.php`

```php
<?php

namespace App\User\Infrastructure\Http\Exception;

use App\User\Domain\Exception\UserNotFound;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onException',
        ];
    }

    public function onException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof UserNotFound) {
            $event->setResponse(new JsonResponse([
                'error' => [
                    'code' => 'USER_NOT_FOUND',
                    'message' => $exception->getMessage(),
                ],
            ], 404));

            return;
        }

        if ($exception instanceof \DomainException) {
            $event->setResponse(new JsonResponse([
                'error' => [
                    'code' => 'DOMAIN_ERROR',
                    'message' => $exception->getMessage(),
                ],
            ], 422));

            return;
        }

        if ($exception instanceof \InvalidArgumentException) {
            $event->setResponse(new JsonResponse([
                'error' => [
                    'code' => 'INVALID_ARGUMENT',
                    'message' => $exception->getMessage(),
                ],
            ], 400));
        }
    }
}
```

No hace falta registrar esta clase a mano en `services.yaml`. Symfony autoconfigura cualquier servicio que implemente `EventSubscriberInterface` siempre que esté en `src/` y el `services.yaml` por defecto del skeleton tenga `autoconfigure: true` (lo trae así desde que instalaste `symfony/skeleton` en el [setup inicial](/lecciones/setup-inicial)). Si después de crear el archivo los errores siguen devolviendo la página de excepción de Symfony en vez del JSON, corre `php bin/console debug:container ApiExceptionSubscriber` para confirmar que el servicio existe y está etiquetado como `kernel.event_subscriber`.

Compruébalo con un test rápido, sin esperar a la lección de Functional Tests:

```php
public function testInvalidIdReturnsBadRequestWithTheErrorContract(): void
{
    $client = static::createClient();

    $client->request('GET', '/api/users/not-a-uuid');

    self::assertResponseStatusCodeSame(400);

    $body = json_decode($client->getResponse()->getContent(), true);

    self::assertSame('INVALID_ARGUMENT', $body['error']['code']);
}
```

Sin el subscriber, este test falla con un `500` y una página HTML de error en vez de JSON. Con él, falla en `400` con el contrato correcto — ese es tu GREEN para esta lección.

### Mejora: excepciones específicas

Hay un problema escondido en el subscriber de arriba: `CreateUserHandler` y `UpdateUserHandler` (lección de [Capa de Aplicación](/lecciones/capa-de-aplicacion)) lanzan `new \DomainException('Email already exists.')` para un email duplicado — y el subscriber mapea **cualquier** `\DomainException` a `422`. Eso significa que, tal como está ahora mismo el código, un email duplicado responde `422`, no `409`, aunque la tabla de arriba prometa `409`. Vamos a cerrar esa brecha con una excepción específica en vez de depender de la genérica.

`src/User/Domain/Exception/UserEmailAlreadyExists.php`

```php
<?php

namespace App\User\Domain\Exception;

final class UserEmailAlreadyExists extends \DomainException
{
    public static function withEmail(string $email): self
    {
        return new self(
            sprintf('User with email "%s" already exists.', $email)
        );
    }
}
```

Ahora actualiza `CreateUserHandler` y `UpdateUserHandler` para lanzarla en vez de la genérica (con su `use App\User\Domain\Exception\UserEmailAlreadyExists;` correspondiente):

```php
if ($existing !== null) {
    throw UserEmailAlreadyExists::withEmail($command->email);
}
```

Y agrega su propio branch en el subscriber — **antes** del `\DomainException` genérico, porque `UserEmailAlreadyExists` también es un `\DomainException` y PHP evalúa los `if` en orden: si el branch genérico fuera primero, siempre ganaría él. Así queda `onException()` completo, con el branch nuevo insertado entre `UserNotFound` y el genérico:

```php
public function onException(ExceptionEvent $event): void
{
    $exception = $event->getThrowable();

    if ($exception instanceof UserNotFound) {
        $event->setResponse(new JsonResponse([
            'error' => [
                'code' => 'USER_NOT_FOUND',
                'message' => $exception->getMessage(),
            ],
        ], 404));

        return;
    }

    if ($exception instanceof UserEmailAlreadyExists) {
        $event->setResponse(new JsonResponse([
            'error' => [
                'code' => 'USER_EMAIL_ALREADY_EXISTS',
                'message' => $exception->getMessage(),
            ],
        ], 409));

        return;
    }

    if ($exception instanceof \DomainException) {
        $event->setResponse(new JsonResponse([
            'error' => [
                'code' => 'DOMAIN_ERROR',
                'message' => $exception->getMessage(),
            ],
        ], 422));

        return;
    }

    if ($exception instanceof \InvalidArgumentException) {
        $event->setResponse(new JsonResponse([
            'error' => [
                'code' => 'INVALID_ARGUMENT',
                'message' => $exception->getMessage(),
            ],
        ], 400));
    }
}
```

No olvides el `use App\User\Domain\Exception\UserEmailAlreadyExists;` al inicio del archivo, junto al `use` de `UserNotFound` que ya tenías.

> **✏️ Ejercicio —** Haz este cambio y vuelve a correr `CreateUserHandlerTest::testItRejectsADuplicateEmail` (lección 9) — sigue en verde, porque solo comprueba `expectException(\DomainException::class)` y `UserEmailAlreadyExists` sigue siendo una. Después corre el Functional Test de email duplicado de la lección de [Functional Tests](/lecciones/functional-tests): antes de este cambio fallaba esperando `409` y recibiendo `422` (RED); después de este cambio, `409` real (GREEN). Ese desfase entre lo que promete la tabla de contrato y lo que el código realmente hacía es exactamente el tipo de cosa que un test end-to-end detecta y un test unitario no.

Para un proyecto real, el mismo patrón se extiende a más reglas de dominio:

```tree
!files
Domain
  Exception
    UserNotFound.php
    UserEmailAlreadyExists.php
    InvalidEmail.php
    InvalidUserName.php
```

| Excepción | HTTP |
|---|---|
| `UserNotFound` | 404 |
| `UserEmailAlreadyExists` | 409 |
| `InvalidEmail` | 422 |
| `InvalidUserName` | 422 |

`InvalidEmail` e `InvalidUserName` quedan como ejercicio adicional si quieres que la validación de formato (hoy un `\InvalidArgumentException` genérico → 400) se distinga de una violación de invariante de negocio (→ 422) — hoy ambas comparten el mismo branch genérico de `\InvalidArgumentException`, igual que pasaba con el email duplicado antes de este arreglo.

### Error Contract

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User \"123\" was not found."
  }
}
```

Para conflictos:

```json
{
  "error": {
    "code": "USER_EMAIL_ALREADY_EXISTS",
    "message": "Email already exists."
  }
}
```

Esto permite que un frontend consuma códigos estables en lugar de parsear mensajes en texto libre.

### Validación HTTP vs Domain

No son lo mismo.

**HTTP/Application** puede validar: campo presente, tipo, longitud, estructura JSON.

**Domain** debe validar: email válido, nombre válido, invariantes, reglas de negocio.

¿Por qué? Porque el Domain podría ser utilizado por: HTTP, CLI, Worker, Message Consumer, Batch, Importador. Si las reglas solamente están en el Controller, el CLI podría saltárselas.

### JSON inválido

Debemos probar `POST /api/users` con `{ "email":` (JSON malformado). Eso debe resultar en **400 Bad Request**, y no en **500 Internal Server Error**. El manejo del parsing JSON pertenece a Infrastructure.
