---
slug: "capa-de-aplicacion"
order: 8
module: "aplicacion"
title: "Capa de Aplicación"
summary: "El DTO de respuesta y los cinco casos de uso del CRUD: CreateUser, GetUser, ListUsers, UpdateUser y DeleteUser."
objectives:
  - "Separar Command (escritura) de Query (lectura) desde el primer caso de uso."
  - "Escribir un Handler por caso de uso, orquestando el dominio a través del puerto UserRepository."
  - "Convertir entidades de dominio en DTOs de respuesta con UserResponse."
newFiles:
  - "src/User/Application/DTO/UserResponse.php"
  - "src/User/Application/Command/CreateUser/CreateUserCommand.php"
  - "src/User/Application/Command/CreateUser/CreateUserHandler.php"
  - "src/User/Application/Query/GetUser/GetUserQuery.php"
  - "src/User/Application/Query/GetUser/GetUserHandler.php"
  - "src/User/Application/Query/ListUsers/ListUsersQuery.php"
  - "src/User/Application/Query/ListUsers/ListUsersHandler.php"
  - "src/User/Application/Command/UpdateUser/UpdateUserCommand.php"
  - "src/User/Application/Command/UpdateUser/UpdateUserHandler.php"
  - "src/User/Application/Command/DeleteUser/DeleteUserCommand.php"
  - "src/User/Application/Command/DeleteUser/DeleteUserHandler.php"
---

### DTO

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

### CreateUser

Command:

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

Handler:

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

### GetUser

Query:

```php
final readonly class GetUserQuery
{
    public function __construct(
        public string $id
    ) {}
}
```

Handler:

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

### ListUsers

Query:

```php
final readonly class ListUsersQuery
{
}
```

Handler:

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

### UpdateUser

Command:

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

Handler:

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

### DeleteUser

Command:

```php
final readonly class DeleteUserCommand
{
    public function __construct(
        public string $id
    ) {}
}
```

Handler:

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

Ya tenemos los cinco casos de uso completos. Pero para poder testearlos rápido, sin MySQL ni Doctrine, necesitamos un repositorio de prueba — eso es lo que sigue.
