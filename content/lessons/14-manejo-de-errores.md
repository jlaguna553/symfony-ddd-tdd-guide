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

### Mejora: excepciones específicas

Para un proyecto real no conviene tener todo bajo `\DomainException`. Es mejor:

```tree
!files
Domain
  Exception
    UserNotFound.php
    UserEmailAlreadyExists.php
    InvalidEmail.php
    InvalidUserName.php
```

Entonces podemos mapear cada una a su código:

| Excepción | HTTP |
|---|---|
| `UserNotFound` | 404 |
| `UserEmailAlreadyExists` | 409 |
| `InvalidEmail` | 422 |
| `InvalidUserName` | 422 |

Esto evita depender de mensajes como `"Email already exists."` para decidir el código de respuesta.

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
