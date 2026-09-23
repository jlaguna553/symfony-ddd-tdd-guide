---
slug: "controllers-http"
order: 13
module: "infraestructura"
title: "Capa HTTP: Controllers"
summary: "Los cinco controllers del CRUD, delgados a propósito: solo traducen HTTP a Application y de vuelta. Empezamos con un test funcional que falla antes de que el primer controller exista."
objectives:
  - "Escribir un Functional Test que falla porque la ruta no existe, antes de escribir el primer controller."
  - "Implementar los cinco endpoints del contrato HTTP: POST, GET (lista y por id), PUT y DELETE."
  - "Verificar con debug:router que Symfony realmente registró las rutas por atributo."
  - "Entender por qué un controller nunca debe contener reglas de negocio."
newFiles:
  - "tests/Functional/User/CreateUserControllerTest.php"
  - "src/User/Infrastructure/Http/Controller/CreateUserController.php"
  - "src/User/Infrastructure/Http/Controller/ListUsersController.php"
  - "src/User/Infrastructure/Http/Controller/GetUserController.php"
  - "src/User/Infrastructure/Http/Controller/UpdateUserController.php"
  - "src/User/Infrastructure/Http/Controller/DeleteUserController.php"
---

Seguimos dentro de la Capa de Infraestructura que empezó en [Persistencia con Doctrine](/lecciones/infraestructura-doctrine) — pero cambiamos de mitad. Ya cerramos `Infrastructure/Persistence/`; ahora toca `Infrastructure/Http/`: los Controllers que traducen peticiones HTTP en Commands y Queries para la capa de Aplicación.

### Contrato HTTP al que apuntamos

| Método | Endpoint | Resultado |
|---|---|---|
| POST | `/api/users` | 201 |
| GET | `/api/users` | 200 |
| GET | `/api/users/{id}` | 200 |
| PUT | `/api/users/{id}` | 204 |
| DELETE | `/api/users/{id}` | 204 |

### El mismo ciclo, ahora contra HTTP

Todo lo que construimos hasta ahora se puede probar sin un servidor. Un controller es distinto: vive en el borde del sistema, así que su test necesita simular una petición HTTP real. Symfony trae `WebTestCase` justamente para eso — y el ciclo sigue siendo RED → GREEN → REFACTOR, solo que ahora "RED" significa una ruta que ni siquiera existe.

**RED.** `tests/Functional/User/CreateUserControllerTest.php`

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

Corre:

```bash
APP_ENV=test php bin/phpunit tests/Functional/User/CreateUserControllerTest.php
```

Vas a ver un `404 Not Found` en vez de `201` — la ruta `/api/users` no existe todavía porque no hay ningún controller registrado para ella. Eso es RED, y es un RED distinto a los anteriores: no es "la clase no existe" sino "el sistema no sabe qué hacer con esta petición". Es exactamente el mismo tipo de fallo que vería un usuario real pegándole a tu API.

**GREEN.** `src/User/Infrastructure/Http/Controller/CreateUserController.php`

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

Antes de volver a correr el test, confirma que Symfony efectivamente registró la ruta:

```bash
php bin/console debug:router
```

Deberías ver `/api/users` con el método `POST` en la lista. Si no aparece, revisa que el atributo `#[Route]` esté importado desde `Symfony\Component\Routing\Attribute\Route` (no `Annotation\Route`, que es la sintaxis antigua) y que el bundle `webapp` que instalamos en el [setup inicial](/lecciones/setup-inicial) esté cargando las rutas por atributo desde `src/` — el skeleton de Symfony lo configura por defecto, así que si seguiste esa lección tal cual no deberías tener que tocar nada.

Ahora sí, corre el test otra vez:

```
OK (1 test, 2 assertions)
```

GREEN. El controller no valida nada, no conoce `Email` ni `User` — solo desempaqueta el JSON, arma el Command, y traduce el resultado del Handler a una respuesta HTTP. Nota también que **no** hay `try/catch` aquí: si `CreateUserHandler` lanza una excepción (email inválido, email duplicado), en este momento el request explota con un `500 Internal Server Error`. Eso lo arreglamos en la próxima lección.

### Los cuatro controllers restantes

Mismo patrón, mismo nivel de "tonto a propósito": reciben el request, arman un Command o Query, llaman al Handler, devuelven una respuesta.

`src/User/Infrastructure/Http/Controller/ListUsersController.php`

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

`src/User/Infrastructure/Http/Controller/GetUserController.php`

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

`src/User/Infrastructure/Http/Controller/UpdateUserController.php`

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

`src/User/Infrastructure/Http/Controller/DeleteUserController.php`

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

> **✏️ Ejercicio —** Antes de seguir, escribe un Functional Test para `GET /api/users/{id}` igual que hicimos con `POST`: confírmalo en RED (la ruta no existe todavía si comentas el controller), y en GREEN una vez que lo tengas. Vas a formalizar esta batería completa de tests en la próxima lección — hacerlo ahora, uno a la vez, es la mejor forma de que el patrón se quede contigo.

### ¿Por qué controllers delgados?

Porque el controller debe traducir `HTTP → Application` y después `Application → HTTP Response`. No debe ser el lugar donde viven las reglas de negocio — esas ya viven en el dominio y en los handlers, lecciones atrás. Un controller que crece con `if`s de validación de negocio es una regla que se escapó del dominio y terminó en el sitio equivocado.

Corre `php bin/phpunit tests/Unit tests/Application` una vez más antes de seguir: nada de lo que hicimos en esta lección debería haber roto ningún test anterior. Si algo falló, es una señal de que un controller está haciendo más de lo que debería.
