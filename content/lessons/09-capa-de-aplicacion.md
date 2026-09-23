---
slug: "capa-de-aplicacion"
order: 9
module: "aplicacion"
title: "Capa de Aplicación"
summary: "El DTO de respuesta y los cinco casos de uso del CRUD, cada uno nacido de un test que corres tú mismo antes de ver la implementación."
objectives:
  - "Escribir el test de CreateUserHandler antes que el propio Handler, usando InMemoryUserRepository, y ver el ciclo RED → GREEN."
  - "Separar Command (escritura) de Query (lectura) desde el primer caso de uso."
  - "Cubrir los casos de error de cada Handler (no encontrado, email duplicado) con tests explícitos, no solo mencionarlos."
  - "Escribir tú mismo los tests de UpdateUserHandler y DeleteUserHandler como ejercicio guiado."
newFiles:
  - "src/User/Application/DTO/UserResponse.php"
  - "src/User/Application/Command/CreateUser/CreateUserCommand.php"
  - "src/User/Application/Command/CreateUser/CreateUserHandler.php"
  - "tests/Application/User/Command/CreateUser/CreateUserHandlerTest.php"
  - "src/User/Application/Query/GetUser/GetUserQuery.php"
  - "src/User/Application/Query/GetUser/GetUserHandler.php"
  - "tests/Application/User/Query/GetUser/GetUserHandlerTest.php"
  - "src/User/Application/Query/ListUsers/ListUsersQuery.php"
  - "src/User/Application/Query/ListUsers/ListUsersHandler.php"
  - "tests/Application/User/Query/ListUsers/ListUsersHandlerTest.php"
  - "src/User/Application/Command/UpdateUser/UpdateUserCommand.php"
  - "src/User/Application/Command/UpdateUser/UpdateUserHandler.php"
  - "tests/Application/User/Command/UpdateUser/UpdateUserHandlerTest.php"
  - "src/User/Application/Command/DeleteUser/DeleteUserCommand.php"
  - "src/User/Application/Command/DeleteUser/DeleteUserHandler.php"
  - "tests/Application/User/Command/DeleteUser/DeleteUserHandlerTest.php"
---

### DTO

Antes del primer caso de uso necesitamos algo que devolver al exterior sin exponer la entidad de dominio directamente. `UserResponse` no tiene reglas que probar — es una simple conversión de datos — así que lo escribimos directo, sin ciclo TDD.

`src/User/Application/DTO/UserResponse.php`

```php
<?php

namespace App\User\Application\DTO;

use App\User\Domain\Entity\User;

final readonly class UserResponse
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name
    ) {}

    public static function fromEntity(
        User $user
    ): self {
        return new self(
            $user->id()->value(),
            $user->email()->value(),
            $user->name()
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
        ];
    }
}
```

### CreateUser — el ciclo completo, con casos de error incluidos

**RED.** El test de un Handler no usa Doctrine ni MySQL: usa el `InMemoryUserRepository` de la lección anterior. Eso es justo lo que hace que este test sea rápido y determinista.

`tests/Application/User/Command/CreateUser/CreateUserHandlerTest.php`

```php
<?php

namespace App\Tests\Application\User\Command\CreateUser;

use App\Tests\Double\User\InMemoryUserRepository;
use App\User\Application\Command\CreateUser\CreateUserCommand;
use App\User\Application\Command\CreateUser\CreateUserHandler;
use App\User\Domain\ValueObject\Email;
use PHPUnit\Framework\TestCase;

final class CreateUserHandlerTest extends TestCase
{
    public function testItCreatesAUser(): void
    {
        $repository = new InMemoryUserRepository();
        $handler = new CreateUserHandler($repository);

        $id = $handler(new CreateUserCommand('john@example.com', 'John Doe'));

        $user = $repository->findByEmail(Email::fromString('john@example.com'));

        self::assertNotNull($user);
        self::assertSame($id, $user->id()->value());
    }

    public function testItRejectsADuplicateEmail(): void
    {
        $repository = new InMemoryUserRepository();
        $handler = new CreateUserHandler($repository);

        $handler(new CreateUserCommand('john@example.com', 'John Doe'));

        $this->expectException(\DomainException::class);

        $handler(new CreateUserCommand('john@example.com', 'Another Name'));
    }
}
```

Corre:

```bash
php bin/phpunit tests/Application/User/Command/CreateUser/CreateUserHandlerTest.php
```

Falla porque `CreateUserCommand` y `CreateUserHandler` no existen. RED.

**GREEN.** Primero el Command — un objeto de datos simple, sin lógica:

`src/User/Application/Command/CreateUser/CreateUserCommand.php`

```php
<?php

namespace App\User\Application\Command\CreateUser;

final readonly class CreateUserCommand
{
    public function __construct(
        public string $email,
        public string $name
    ) {}
}
```

Y el Handler, que orquesta el dominio:

`src/User/Application/Command/CreateUser/CreateUserHandler.php`

```php
<?php

namespace App\User\Application\Command\CreateUser;

use App\User\Domain\Entity\User;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;

final class CreateUserHandler
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function __invoke(
        CreateUserCommand $command
    ): string {
        $email = Email::fromString($command->email);

        $existing = $this->users->findByEmail($email);

        if ($existing !== null) {
            throw new \DomainException('Email already exists.');
        }

        $user = User::create(
            UserId::generate(),
            $email,
            $command->name
        );

        $this->users->save($user);

        return $user->id()->value();
    }
}
```

Corre el test otra vez:

```
OK (2 tests, 3 assertions)
```

GREEN. Fíjate qué hace exactamente este Handler y qué **no** hace: valida el email (delegando en el Value Object), pregunta al repositorio si ya existe, construye la entidad (delegando en `User::create()`, que a su vez valida el nombre) y guarda. El Handler no valida nada él mismo — cada regla vive en el objeto de dominio que le corresponde. Un Handler que empieza a acumular `if` de validación propia es una señal de que esa regla debería estar en el dominio, no aquí.

### GetUser

**RED.** Esta vez el caso de error no es "duplicado" sino "no encontrado" — y es la primera vez que vas a ver `UserNotFound` lanzarse de verdad, no solo mencionarse.

`tests/Application/User/Query/GetUser/GetUserHandlerTest.php`

```php
<?php

namespace App\Tests\Application\User\Query\GetUser;

use App\Tests\Double\User\InMemoryUserRepository;
use App\User\Application\Command\CreateUser\CreateUserCommand;
use App\User\Application\Command\CreateUser\CreateUserHandler;
use App\User\Application\Query\GetUser\GetUserQuery;
use App\User\Application\Query\GetUser\GetUserHandler;
use App\User\Domain\Exception\UserNotFound;
use App\User\Domain\ValueObject\UserId;
use PHPUnit\Framework\TestCase;

final class GetUserHandlerTest extends TestCase
{
    public function testItReturnsAnExistingUser(): void
    {
        $repository = new InMemoryUserRepository();
        $id = (new CreateUserHandler($repository))(
            new CreateUserCommand('john@example.com', 'John Doe')
        );

        $response = (new GetUserHandler($repository))(new GetUserQuery($id));

        self::assertSame($id, $response->id);
        self::assertSame('john@example.com', $response->email);
    }

    public function testItThrowsWhenTheUserDoesNotExist(): void
    {
        $repository = new InMemoryUserRepository();

        $this->expectException(UserNotFound::class);

        (new GetUserHandler($repository))(
            new GetUserQuery(UserId::generate()->value())
        );
    }
}
```

Corre `php bin/phpunit tests/Application/User/Query/GetUser/GetUserHandlerTest.php` — RED, `GetUserQuery` y `GetUserHandler` no existen todavía. Nota que el test importa (`use`) las dos clases de `App\User\Application\Query\GetUser` aunque no existan aún: eso no es un error, es exactamente lo que hace que PHPUnit te devuelva "Class not found" en vez de un error de sintaxis — el `use` describe dónde *deberían* vivir, y tu trabajo en el paso GREEN es hacer que ese archivo exista ahí.

**GREEN.**

`src/User/Application/Query/GetUser/GetUserQuery.php`

```php
<?php

namespace App\User\Application\Query\GetUser;

final readonly class GetUserQuery
{
    public function __construct(
        public string $id
    ) {}
}
```

`src/User/Application/Query/GetUser/GetUserHandler.php`

```php
<?php

namespace App\User\Application\Query\GetUser;

use App\User\Application\DTO\UserResponse;
use App\User\Domain\Exception\UserNotFound;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\UserId;

final class GetUserHandler
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function __invoke(
        GetUserQuery $query
    ): UserResponse {
        $user = $this->users->findById(
            UserId::fromString($query->id)
        );

        if ($user === null) {
            throw UserNotFound::withId($query->id);
        }

        return UserResponse::fromEntity($user);
    }
}
```

Corre otra vez: `OK (2 tests, 2 assertions)`. Nota que reutilizamos `CreateUserHandler` dentro del test de `GetUserHandler` para crear el usuario de prueba — es más honesto que insertar un `User` "a mano" en el repositorio, porque así el test pasa por el mismo camino que pasaría en producción. Y nota también que `GetUserHandler` importa `UserRepository` y `UserId` de `App\User\Domain\...` — namespace distinto al suyo (`App\User\Application\Query\GetUser`) — por eso ahí el `use` sí hace falta, a diferencia del ejercicio de la lección anterior donde todo compartía un mismo namespace.

### ListUsers

Aquí no hay un caso de error que probar — solo dos escenarios: lista vacía y lista con elementos.

`src/User/Application/Query/ListUsers/ListUsersQuery.php`

```php
<?php

namespace App\User\Application\Query\ListUsers;

final readonly class ListUsersQuery
{
}
```

`src/User/Application/Query/ListUsers/ListUsersHandler.php`

```php
<?php

namespace App\User\Application\Query\ListUsers;

use App\User\Application\DTO\UserResponse;
use App\User\Domain\Repository\UserRepository;

final class ListUsersHandler
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function __invoke(
        ListUsersQuery $query
    ): array {
        return array_map(
            static fn ($user) => UserResponse::fromEntity($user),
            $this->users->findAll()
        );
    }
}
```

`tests/Application/User/Query/ListUsers/ListUsersHandlerTest.php`

```php
<?php

namespace App\Tests\Application\User\Query\ListUsers;

use App\Tests\Double\User\InMemoryUserRepository;
use App\User\Application\Command\CreateUser\CreateUserCommand;
use App\User\Application\Command\CreateUser\CreateUserHandler;
use App\User\Application\Query\ListUsers\ListUsersHandler;
use App\User\Application\Query\ListUsers\ListUsersQuery;
use PHPUnit\Framework\TestCase;

final class ListUsersHandlerTest extends TestCase
{
    public function testItReturnsAnEmptyListWhenThereAreNoUsers(): void
    {
        $handler = new ListUsersHandler(new InMemoryUserRepository());

        self::assertSame([], $handler(new ListUsersQuery()));
    }

    public function testItReturnsAllUsers(): void
    {
        $repository = new InMemoryUserRepository();
        (new CreateUserHandler($repository))(new CreateUserCommand('a@example.com', 'A'));
        (new CreateUserHandler($repository))(new CreateUserCommand('b@example.com', 'B'));

        $result = (new ListUsersHandler($repository))(new ListUsersQuery());

        self::assertCount(2, $result);
    }
}
```

Mismo ciclo: crea el test en su ruta, mira el RED, crea la implementación en la suya, mira el GREEN.

### UpdateUser y DeleteUser — ahora sin la solución al lado

Ya viste el patrón tres veces, incluyendo dónde va cada archivo y qué se importa. `UpdateUser` necesita cubrir **tres** casos: actualización exitosa, usuario no encontrado, y el mismo problema de email duplicado que vimos en `CreateUser` — pero con una diferencia importante: si el usuario se actualiza a **su propio** email actual, eso no debería contar como duplicado.

> **✏️ Ejercicio —** Escribe `tests/Application/User/Command/UpdateUser/UpdateUserHandlerTest.php` (namespace `App\Tests\Application\User\Command\UpdateUser`) con estos tres casos:
> 1. Actualizar un usuario existente cambia su email y nombre.
> 2. Actualizar un ID que no existe lanza `UserNotFound`.
> 3. Actualizar el email de un usuario al email de **otro** usuario ya existente lanza `\DomainException` — pero actualizar un usuario reasignándole el mismo email que ya tenía **no** debe lanzar nada.
>
> Corre el test contra un `UpdateUserHandler` que todavía no existe (RED), después escribe `UpdateUserCommand` y `UpdateUserHandler` en `src/User/Application/Command/UpdateUser/` para que pase (GREEN). Pista para el caso 3: no basta con `findByEmail() !== null` como en `CreateUser` — necesitas comparar si el usuario encontrado por email es el *mismo* que estás actualizando, usando `equals()` sobre el `UserId`.

Solución de referencia, para comparar después de intentarlo:

`src/User/Application/Command/UpdateUser/UpdateUserCommand.php`

```php
<?php

namespace App\User\Application\Command\UpdateUser;

final readonly class UpdateUserCommand
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name
    ) {}
}
```

`src/User/Application/Command/UpdateUser/UpdateUserHandler.php`

```php
<?php

namespace App\User\Application\Command\UpdateUser;

use App\User\Domain\Exception\UserNotFound;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;

final class UpdateUserHandler
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function __invoke(
        UpdateUserCommand $command
    ): void {
        $id = UserId::fromString($command->id);

        $user = $this->users->findById($id);

        if ($user === null) {
            throw UserNotFound::withId($command->id);
        }

        $email = Email::fromString($command->email);

        $existing = $this->users->findByEmail($email);

        if ($existing !== null && !$existing->id()->equals($id)) {
            throw new \DomainException('Email already exists.');
        }

        $user->update($email, $command->name);

        $this->users->save($user);
    }
}
```

`DeleteUser` es más simple: solo dos casos, borrado exitoso y "no encontrado".

> **✏️ Ejercicio —** Escribe `tests/Application/User/Command/DeleteUser/DeleteUserHandlerTest.php` (namespace `App\Tests\Application\User\Command\DeleteUser`) con: (1) borrar un usuario existente hace que `findById()` devuelva `null` después, y (2) borrar un ID inexistente lanza `UserNotFound`. Después escribe `DeleteUserCommand` y `DeleteUserHandler` en `src/User/Application/Command/DeleteUser/`.

Solución de referencia:

`src/User/Application/Command/DeleteUser/DeleteUserCommand.php`

```php
<?php

namespace App\User\Application\Command\DeleteUser;

final readonly class DeleteUserCommand
{
    public function __construct(
        public string $id
    ) {}
}
```

`src/User/Application/Command/DeleteUser/DeleteUserHandler.php`

```php
<?php

namespace App\User\Application\Command\DeleteUser;

use App\User\Domain\Exception\UserNotFound;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\UserId;

final class DeleteUserHandler
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function __invoke(
        DeleteUserCommand $command
    ): void {
        $id = UserId::fromString($command->id);

        $user = $this->users->findById($id);

        if ($user === null) {
            throw UserNotFound::withId($command->id);
        }

        $this->users->delete($user);
    }
}
```

Con esto, los cinco casos de uso están completos y cada uno tiene un test que corriste en RED antes de verlo en GREEN — incluyendo sus casos de error, no solo el camino feliz. Cuando lleguemos a Doctrine, estos mismos tests van a seguir pasando sin tocarles una línea, porque no conocen ni les importa qué implementación de `UserRepository` reciben.
