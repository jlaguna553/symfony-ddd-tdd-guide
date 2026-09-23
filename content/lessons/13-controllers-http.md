---
slug: "controllers-http"
order: 13
module: "http"
title: "Capa HTTP: Controllers"
summary: "Los cinco controllers del CRUD, delgados a propósito: solo traducen HTTP a Application y de vuelta."
objectives:
  - "Implementar los cinco endpoints del contrato HTTP: POST, GET (lista y por id), PUT y DELETE."
  - "Entender por qué un controller nunca debe contener reglas de negocio."
newFiles:
  - "src/User/Infrastructure/Http/Controller/CreateUserController.php"
  - "src/User/Infrastructure/Http/Controller/ListUsersController.php"
  - "src/User/Infrastructure/Http/Controller/GetUserController.php"
  - "src/User/Infrastructure/Http/Controller/UpdateUserController.php"
  - "src/User/Infrastructure/Http/Controller/DeleteUserController.php"
---

### POST Controller

`src/User/Infrastructure/Http/Controller/CreateUserController.php`

```php
<?php

namespace App\User\Infrastructure\Http\Controller;

use App\User\Application\Command\CreateUser\CreateUserCommand;
use App\User\Application\Command\CreateUser\CreateUserHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class CreateUserController
{
    #[Route('/api/users', methods: ['POST'])]
    public function __invoke(
        Request $request,
        CreateUserHandler $handler
    ): JsonResponse {
        $data = $request->toArray();

        $id = $handler(
            new CreateUserCommand(
                $data['email'] ?? '',
                $data['name'] ?? ''
            )
        );

        return new JsonResponse(['id' => $id], Response::HTTP_CREATED);
    }
}
```

### List Controller

```php
<?php

namespace App\User\Infrastructure\Http\Controller;

use App\User\Application\Query\ListUsers\ListUsersHandler;
use App\User\Application\Query\ListUsers\ListUsersQuery;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ListUsersController
{
    #[Route('/api/users', methods: ['GET'])]
    public function __invoke(
        ListUsersHandler $handler
    ): JsonResponse {
        $users = $handler(new ListUsersQuery());

        return new JsonResponse(
            array_map(static fn ($user) => $user->toArray(), $users)
        );
    }
}
```

### Get Controller

```php
<?php

namespace App\User\Infrastructure\Http\Controller;

use App\User\Application\Query\GetUser\GetUserHandler;
use App\User\Application\Query\GetUser\GetUserQuery;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class GetUserController
{
    #[Route('/api/users/{id}', methods: ['GET'])]
    public function __invoke(
        string $id,
        GetUserHandler $handler
    ): JsonResponse {
        $user = $handler(new GetUserQuery($id));

        return new JsonResponse($user->toArray());
    }
}
```

### Update Controller

```php
<?php

namespace App\User\Infrastructure\Http\Controller;

use App\User\Application\Command\UpdateUser\UpdateUserCommand;
use App\User\Application\Command\UpdateUser\UpdateUserHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class UpdateUserController
{
    #[Route('/api/users/{id}', methods: ['PUT'])]
    public function __invoke(
        string $id,
        Request $request,
        UpdateUserHandler $handler
    ): JsonResponse {
        $data = $request->toArray();

        $handler(
            new UpdateUserCommand(
                $id,
                $data['email'] ?? '',
                $data['name'] ?? ''
            )
        );

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
```

### Delete Controller

```php
<?php

namespace App\User\Infrastructure\Http\Controller;

use App\User\Application\Command\DeleteUser\DeleteUserCommand;
use App\User\Application\Command\DeleteUser\DeleteUserHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DeleteUserController
{
    #[Route('/api/users/{id}', methods: ['DELETE'])]
    public function __invoke(
        string $id,
        DeleteUserHandler $handler
    ): JsonResponse {
        $handler(new DeleteUserCommand($id));

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
```

### Contrato HTTP

| Método | Endpoint | Resultado |
|---|---|---|
| POST | `/api/users` | 201 |
| GET | `/api/users` | 200 |
| GET | `/api/users/{id}` | 200 |
| PUT | `/api/users/{id}` | 204 |
| DELETE | `/api/users/{id}` | 204 |

### ¿Por qué controllers delgados?

Porque el controller debe traducir `HTTP → Application` y después `Application → HTTP Response`. No debe ser el lugar donde viven las reglas de negocio — esas ya viven en el dominio y en los handlers, lecciones atrás.

Ahora mismo, si alguien manda un email inválido, el `CreateUserHandler` lanza una excepción y el request explota con un 500. Eso lo arreglamos en la próxima lección.
