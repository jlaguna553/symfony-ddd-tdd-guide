---
slug: "capa-de-dominio"
order: 7
module: "dominio"
title: "Capa de Dominio"
summary: "Construimos Email, UserId, la entidad User, el puerto UserRepository y la excepción UserNotFound — test primero, siempre, sin Symfony ni Doctrine."
objectives:
  - "Escribir el test de un Value Object antes que su implementación, y ver el ciclo RED → GREEN con tus propios ojos."
  - "Escribir tú mismo el Value Object UserId siguiendo el mismo patrón que Email, como ejercicio guiado."
  - "Modelar la entidad User protegiendo sus invariantes en create() y update(), otra vez test-first."
  - "Entender el patrón de constructor con nombre (named constructor) y por qué el constructor real es privado."
  - "Definir el puerto UserRepository como interfaz del dominio, sin mencionar Doctrine."
newFiles:
  - "src/User/Domain/ValueObject/Email.php"
  - "tests/Unit/User/Domain/ValueObject/EmailTest.php"
  - "src/User/Domain/ValueObject/UserId.php"
  - "tests/Unit/User/Domain/ValueObject/UserIdTest.php"
  - "src/User/Domain/Entity/User.php"
  - "tests/Unit/User/Domain/Entity/UserTest.php"
  - "src/User/Domain/Repository/UserRepository.php"
  - "src/User/Domain/Exception/UserNotFound.php"
---

Cada pieza de esta lección nace igual: **primero el test, después el código.** Si vienes de la lección anterior ya sabes por qué — aquí simplemente lo aplicamos al dominio real.

### Email Value Object — el ciclo completo

**RED.** Antes de escribir una sola línea de `Email`, escribe su test.

`tests/Unit/User/Domain/ValueObject/EmailTest.php`

```php
<?php

namespace App\Tests\Unit\User\Domain\ValueObject;

use App\User\Domain\ValueObject\Email;
use PHPUnit\Framework\TestCase;

final class EmailTest extends TestCase
{
    public function testItCreatesAValidEmail(): void
    {
        $email = Email::fromString('john@example.com');

        self::assertSame('john@example.com', $email->value());
    }

    public function testItRejectsAnInvalidEmail(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        Email::fromString('not-an-email');
    }

    public function testItNormalizesEmail(): void
    {
        $email = Email::fromString('  JOHN@EXAMPLE.COM ');

        self::assertSame('john@example.com', $email->value());
    }
}
```

Tres casos: uno feliz, uno de rechazo, uno de normalización. Corre el test:

```bash
php bin/phpunit tests/Unit/User/Domain/ValueObject/EmailTest.php
```

Como `Email` todavía no existe, vas a ver algo como:

```
Error: Class "App\User\Domain\ValueObject\Email" not found
```

Eso es RED. Ahora sí, la implementación mínima para pasar los tres casos.

**GREEN.** `src/User/Domain/ValueObject/Email.php`

```php
<?php

namespace App\User\Domain\ValueObject;

final readonly class Email
{
    private function __construct(
        private string $value
    ) {}

    public static function fromString(string $email): self
    {
        $email = strtolower(trim($email));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException(
                'Invalid email.'
            );
        }

        return new self($email);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

Corre el test de nuevo:

```bash
php bin/phpunit tests/Unit/User/Domain/ValueObject/EmailTest.php
```

```
OK (3 tests, 3 assertions)
```

GREEN. Nota dos detalles de diseño que no están en el enunciado del test pero sí en la implementación:

- **`final readonly class`** — `readonly` (PHP 8.2+) hace que las propiedades no puedan reasignarse después de construirse: si algo intenta `$email->value = 'x'` fuera de la clase, PHP lanza un error en tiempo de ejecución. Es la forma del lenguaje de garantizar la inmutabilidad que un Value Object necesita por definición.
- **Constructor privado + `fromString()` estático** — esto se llama **named constructor** (constructor con nombre). En vez de `new Email('...')`, que no dice nada sobre qué formato espera, `Email::fromString(...)` documenta la intención y, sobre todo, hace *imposible* construir un `Email` sin pasar por la validación. No hay atajo.

**REFACTOR.** Con el test en verde, prueba renombrar una variable interna o reordenar los métodos — el test te avisa si accidentalmente cambias el comportamiento. Ahora sí es seguro tocar el código.

### UserId Value Object — ahora te toca a ti

`UserId` sigue exactamente el mismo patrón que `Email`: constructor privado, un named constructor por cada forma válida de crearlo, y validación antes de construir. La diferencia es que en vez de validar un formato de email, valida un UUID — y en vez de un solo `fromString()`, necesita también un `generate()` para crear IDs nuevos.

> **✏️ Ejercicio —** Antes de ver la solución, escribe tú `tests/Unit/User/Domain/ValueObject/UserIdTest.php` con al menos estos casos, y después la clase `UserId` que los hace pasar:
> - `generate()` devuelve un `UserId` cuyo `value()` es un UUID válido (puedes usar `Symfony\Component\Uid\Uuid::isValid(...)` en el assert).
> - `fromString()` con un UUID válido funciona.
> - `fromString()` con un string que no es un UUID lanza `\InvalidArgumentException`.
> - Dos `UserId` con el mismo valor son `equals()`.
>
> Corre tu test, mira el RED, escribe la implementación, mira el GREEN. Cuando lo tengas, compara contra la solución de abajo.

Test de referencia:

```php
<?php

namespace App\Tests\Unit\User\Domain\ValueObject;

use App\User\Domain\ValueObject\UserId;
use Symfony\Component\Uid\Uuid;
use PHPUnit\Framework\TestCase;

final class UserIdTest extends TestCase
{
    public function testGenerateReturnsAValidUuid(): void
    {
        $id = UserId::generate();

        self::assertTrue(Uuid::isValid($id->value()));
    }

    public function testFromStringAcceptsAValidUuid(): void
    {
        $uuid = Uuid::v4()->toRfc4122();

        $id = UserId::fromString($uuid);

        self::assertSame($uuid, $id->value());
    }

    public function testFromStringRejectsAnInvalidUuid(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        UserId::fromString('not-a-uuid');
    }

    public function testTwoIdsWithTheSameValueAreEqual(): void
    {
        $uuid = Uuid::v4()->toRfc4122();

        self::assertTrue(
            UserId::fromString($uuid)->equals(UserId::fromString($uuid))
        );
    }
}
```

Implementación de referencia. `src/User/Domain/ValueObject/UserId.php`

```php
<?php

namespace App\User\Domain\ValueObject;

use Symfony\Component\Uid\Uuid;

final readonly class UserId
{
    private function __construct(
        private string $value
    ) {}

    public static function generate(): self
    {
        return new self(
            Uuid::v4()->toRfc4122()
        );
    }

    public static function fromString(
        string $value
    ): self {
        if (!Uuid::isValid($value)) {
            throw new \InvalidArgumentException(
                'Invalid user ID.'
            );
        }

        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

Si tu versión difiere en detalles (nombres de variables, orden de métodos) pero los cuatro tests pasan, está bien — el test es el contrato, no la forma exacta del código.

### User Entity — invariantes protegidas, otra vez test-first

`User` es distinto de los Value Objects: tiene identidad (dos `User` con los mismos datos pero distinto `id` son entidades diferentes) y tiene reglas que dependen de más de un campo. La regla que vamos a proteger: **el nombre no puede estar vacío**, ni al crear ni al actualizar.

**RED.**

`tests/Unit/User/Domain/Entity/UserTest.php`

```php
<?php

namespace App\Tests\Unit\User\Domain\Entity;

use App\User\Domain\Entity\User;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testItCreatesAUser(): void
    {
        $id = UserId::generate();
        $email = Email::fromString('john@example.com');

        $user = User::create($id, $email, 'John Doe');

        self::assertTrue($user->id()->equals($id));
        self::assertTrue($user->email()->equals($email));
        self::assertSame('John Doe', $user->name());
    }

    public function testItRejectsAnEmptyNameOnCreate(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        User::create(UserId::generate(), Email::fromString('john@example.com'), '   ');
    }

    public function testItUpdatesEmailAndName(): void
    {
        $user = User::create(
            UserId::generate(),
            Email::fromString('john@example.com'),
            'John Doe'
        );

        $newEmail = Email::fromString('new@example.com');
        $user->update($newEmail, 'New Name');

        self::assertTrue($user->email()->equals($newEmail));
        self::assertSame('New Name', $user->name());
    }

    public function testItRejectsAnEmptyNameOnUpdate(): void
    {
        $user = User::create(
            UserId::generate(),
            Email::fromString('john@example.com'),
            'John Doe'
        );

        $this->expectException(\InvalidArgumentException::class);

        $user->update(Email::fromString('john@example.com'), '');
    }
}
```

Corre `php bin/phpunit tests/Unit/User/Domain/Entity/UserTest.php` — falla porque `User` no existe. RED confirmado.

**GREEN.** `src/User/Domain/Entity/User.php`

```php
<?php

namespace App\User\Domain\Entity;

use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;

final class User
{
    private function __construct(
        private UserId $id,
        private Email $email,
        private string $name
    ) {}

    public static function create(
        UserId $id,
        Email $email,
        string $name
    ): self {
        self::validateName($name);

        return new self($id, $email, $name);
    }

    public function update(
        Email $email,
        string $name
    ): void {
        self::validateName($name);

        $this->email = $email;
        $this->name = $name;
    }

    private static function validateName(
        string $name
    ): void {
        if (trim($name) === '') {
            throw new \InvalidArgumentException(
                'Name cannot be empty.'
            );
        }
    }

    public function id(): UserId
    {
        return $this->id;
    }

    public function email(): Email
    {
        return $this->email;
    }

    public function name(): string
    {
        return $this->name;
    }
}
```

Corre el test otra vez — los cuatro casos en verde. Fíjate que `validateName()` se llama desde **ambos** `create()` y `update()`: la regla de negocio vive en un solo lugar, no se duplica. Esa es la diferencia entre `update()` y un setter público como `setName()` que vimos en la lección de [principios fundamentales](/lecciones/principios-fundamentales) — aquí es donde ese principio deja de ser abstracto.

> **✏️ Ejercicio —** Nota que `User` no tiene `setEmail()` ni `setName()` públicos, solo `update()`. ¿Qué pasaría si alguien agregara `setName()` público a esta clase más adelante para "simplificar" un caso de uso? Escribe en una línea qué invariante se rompería y por qué el test `testItRejectsAnEmptyNameOnUpdate` no lo detectaría si el nuevo código usara el setter en vez de `update()`.

### Repository Port

`src/User/Domain/Repository/UserRepository.php`

```php
<?php

namespace App\User\Domain\Repository;

use App\User\Domain\Entity\User;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;

interface UserRepository
{
    public function save(User $user): void;

    public function findById(UserId $id): ?User;

    public function findByEmail(Email $email): ?User;

    /**
     * @return User[]
     */
    public function findAll(): array;

    public function delete(User $user): void;
}
```

Este archivo es importantísimo. El Domain dice:

> Necesito una forma de guardar y consultar usuarios.

Pero **no** dice:

> Necesito Doctrine.

Fíjate que esta interfaz **no tiene test propio** — y eso es correcto, no un descuido. Una interfaz no tiene comportamiento que probar; el comportamiento lo tienen sus implementaciones (`InMemoryUserRepository` en la próxima lección, `DoctrineUserRepository` más adelante), y cada una se prueba por separado. Testear una interfaz directamente no tiene sentido porque no hay código que ejecutar.

### Excepción UserNotFound

`src/User/Domain/Exception/UserNotFound.php`

```php
<?php

namespace App\User\Domain\Exception;

final class UserNotFound extends \RuntimeException
{
    public static function withId(
        string $id
    ): self {
        return new self(
            sprintf(
                'User "%s" was not found.',
                $id
            )
        );
    }
}
```

Tampoco escribimos un test unitario dedicado para esta excepción: `withId()` es tan simple (construye un mensaje y devuelve `self`) que un test aportaría poca confianza adicional. La regla práctica no es "todo necesita un test", sino "todo lo que tiene una decisión o una rama de comportamiento necesita un test" — y aquí no hay ninguna. Vas a ver esta excepción puesta a prueba indirectamente cuando lleguemos a los Handlers, que es donde realmente se lanza.

Con esto, el dominio está completo y cada pieza nació de un test que primero falló. En la próxima lección construimos el primer test double para poder probar la capa de aplicación sin infraestructura real.
