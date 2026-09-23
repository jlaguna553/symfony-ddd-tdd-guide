---
slug: "inmemory-repository"
order: 8
module: "aplicacion"
title: "Test Double: InMemory Repository"
summary: "Un repositorio implementado con un simple array, que nos permite testear los Handlers de la próxima lección sin infraestructura real."
objectives:
  - "Implementar UserRepository con un array en memoria, cumpliendo el mismo contrato que Doctrine cumplirá después."
  - "Ubicar InMemoryUserRepository dentro de la taxonomía de test doubles: es un Fake, no un Mock."
  - "Entender por qué este repositorio se construye ahora, antes de los Handlers, y no después."
newFiles:
  - "tests/Double/User/InMemoryUserRepository.php"
---

En la lección anterior el dominio quedó completo, pero todavía no hay ningún caso de uso (`CreateUser`, `GetUser`...) que lo orqueste. Antes de escribir el primero, necesitamos algo con lo que probarlo — y ese algo es este repositorio.

### ¿Por qué esto va antes de los Handlers?

Porque un Handler siempre depende de `UserRepository` (la interfaz de la lección anterior), y para escribir el test de un Handler con el ciclo RED → GREEN necesitas poder instanciarlo con **algo** que implemente esa interfaz. Ese algo no puede ser Doctrine todavía — no configuramos Symfony ni MySQL para eso. Por eso este test double nace primero.

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

### ¿Qué tipo de test double es este?

No todos los "objetos falsos" que usas en un test son lo mismo. La jerga más común distingue:

| Tipo | Qué hace | Ejemplo |
|---|---|---|
| **Dummy** | Se pasa como parámetro pero nunca se usa realmente | Un objeto vacío que solo llena la firma de un constructor |
| **Stub** | Devuelve respuestas predefinidas, sin lógica real | Un método que siempre retorna `null` sin importar el input |
| **Fake** | Tiene una implementación real y funcional, pero simplificada | `InMemoryUserRepository` — de verdad guarda, busca y borra, solo que en un array en vez de MySQL |
| **Mock** | Verifica que se llamó con ciertos argumentos, cuántas veces, en qué orden | `$mock->expects($this->once())->method('save')->with($user)` |

`InMemoryUserRepository` es un **Fake**: implementa el contrato completo con lógica real (búsquedas, duplicados, borrado), no solo respuestas fijas. Eso es justo lo que necesitamos — los Handlers de la próxima lección van a ejercitar reglas como "no permitir un email duplicado", y eso requiere que `findByEmail()` realmente busque, no que simule una respuesta.

### ¿Por qué InMemory y no Mocks?

Porque queremos que los Application Tests prueben `CreateUserHandler` de principio a fin — incluyendo qué pasa cuando ya existe un usuario con ese email — y **no**:

```flow
CreateUserHandler
Doctrine
MySQL
network
mapping
```

Con mocks tendrías que programar cada respuesta manualmente (`$mock->method('findByEmail')->willReturn(...)`) y el test terminaría verificando que llamaste a los métodos correctos, no que el comportamiento de negocio es correcto. Con un Fake, el test usa el repositorio casi como usaría el real: guarda un usuario, después pregunta por él, y comprueba el resultado.

Cada cosa tiene su test, y `InMemoryUserRepository` implementa exactamente el mismo contrato (`UserRepository`) que implementará `DoctrineUserRepository` más adelante — eso es lo que hace posible que los Handlers no sepan, ni les importe, contra cuál de los dos están corriendo.
