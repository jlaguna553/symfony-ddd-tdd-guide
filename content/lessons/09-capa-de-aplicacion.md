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

Corre el test — RED, `GetUserQuery` y `GetUserHandler` no existen todavía.

**GREEN.**

```php
final readonly class GetUserQuery
{
    public function __construct(
        public string $id
    ) {}
}
```

```php
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

Corre otra vez: `OK (2 tests, 2 assertions)`. Nota que reutilizamos `CreateUserHandler` dentro del test de `GetUserHandler` para crear el usuario de prueba — es más honesto que insertar un `User` "a mano" en el repositorio, porque así el test pasa por el mismo camino que pasaría en producción.

### ListUsers

Aquí no hay un caso de error que probar — solo dos escenarios: lista vacía y lista con elementos.

```php
final readonly class ListUsersQuery
{
}
```

```php
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

```php
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

Mismo ciclo: escribe el test, mira el RED, escribe la implementación de arriba, mira el GREEN.

### UpdateUser y DeleteUser — ahora sin la solución al lado

Ya viste el patrón tres veces. `UpdateUser` necesita cubrir **tres** casos: actualización exitosa, usuario no encontrado, y el mismo problema de email duplicado que vimos en `CreateUser` — pero con una diferencia importante: si el usuario se actualiza a **su propio** email actual, eso no debería contar como duplicado.

> **✏️ Ejercicio —** Escribe `tests/Application/User/Command/UpdateUser/UpdateUserHandlerTest.php` con estos tres casos:
> 1. Actualizar un usuario existente cambia su email y nombre.
> 2. Actualizar un ID que no existe lanza `UserNotFound`.
> 3. Actualizar el email de un usuario al email de **otro** usuario ya existente lanza `\DomainException` — pero actualizar un usuario reasignándole el mismo email que ya tenía **no** debe lanzar nada.
>
> Corre el test contra un `UpdateUserHandler` que todavía no existe (RED), después escribe `UpdateUserCommand` y `UpdateUserHandler` para que pase (GREEN). Pista para el caso 3: no basta con `findByEmail() !== null` como en `CreateUser` — necesitas comparar si el usuario encontrado por email es el *mismo* que estás actualizando, usando `equals()` sobre el `UserId`.

Solución de referencia, para comparar después de intentarlo:

```php
final readonly class UpdateUserCommand
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name
    ) {}
}
```

```php
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

> **✏️ Ejercicio —** Escribe `tests/Application/User/Command/DeleteUser/DeleteUserHandlerTest.php` con: (1) borrar un usuario existente hace que `findById()` devuelva `null` después, y (2) borrar un ID inexistente lanza `UserNotFound`. Después escribe `DeleteUserCommand` y `DeleteUserHandler`.

Solución de referencia:

```php
final readonly class DeleteUserCommand
{
    public function __construct(
        public string $id
    ) {}
}
```

```php
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
