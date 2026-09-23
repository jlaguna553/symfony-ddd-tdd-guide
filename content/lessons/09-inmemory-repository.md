---
slug: "inmemory-repository"
order: 9
module: "aplicacion"
title: "Test Double: InMemory Repository"
summary: "Un repositorio implementado con un simple array, que nos permite testear los Handlers sin infraestructura real."
objectives:
  - "Implementar UserRepository con un array en memoria, cumpliendo el mismo contrato que Doctrine cumplirá después."
  - "Entender por qué separar Application Tests (InMemory) de Integration Tests (MySQL real) es una decisión deliberada."
newFiles:
  - "tests/Double/User/InMemoryUserRepository.php"
---

`tests/Double/User/InMemoryUserRepository.php`

```php
<?php

namespace App\Tests\Double\User;

use App\User\Domain\Entity\User;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;

final class InMemoryUserRepository implements UserRepository
{
    /**
     * @var array<string, User>
     */
    private array $users = [];

    public function save(User $user): void
    {
        $this->users[$user->id()->value()] = $user;
    }

    public function findById(UserId $id): ?User
    {
        return $this->users[$id->value()] ?? null;
    }

    public function findByEmail(Email $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email()->equals($email)) {
                return $user;
            }
        }

        return null;
    }

    public function findAll(): array
    {
        return array_values($this->users);
    }

    public function delete(User $user): void
    {
        unset($this->users[$user->id()->value()]);
    }
}
```

### ¿Por qué InMemory?

Porque queremos que los Application Tests prueben `CreateUserHandler` y **no**:

```flow
CreateUserHandler
Doctrine
MySQL
network
mapping
```

Cada cosa tiene su test. `InMemoryUserRepository` implementa exactamente el mismo contrato (`UserRepository`) que implementará `DoctrineUserRepository` más adelante — eso es lo que hace posible que los Handlers no sepan (ni les importe) contra cuál de los dos están corriendo.
