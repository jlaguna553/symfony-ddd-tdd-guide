---
slug: "capa-de-dominio"
order: 7
module: "dominio"
title: "Capa de Dominio"
summary: "Construimos Email, UserId, la entidad User, el puerto UserRepository y la excepción UserNotFound — sin Symfony ni Doctrine."
objectives:
  - "Escribir un Value Object inmutable con validación en su constructor estático (Email)."
  - "Escribir un segundo Value Object basado en UUID (UserId)."
  - "Modelar la entidad User protegiendo sus invariantes en create() y update()."
  - "Definir el puerto UserRepository como interfaz del dominio, sin mencionar Doctrine."
newFiles:
  - "src/User/Domain/ValueObject/Email.php"
  - "tests/Unit/User/Domain/ValueObject/EmailTest.php"
  - "src/User/Domain/ValueObject/UserId.php"
  - "src/User/Domain/Entity/User.php"
  - "src/User/Domain/Repository/UserRepository.php"
  - "src/User/Domain/Exception/UserNotFound.php"
---

### Email Value Object

`src/User/Domain/ValueObject/Email.php`

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

### Test de Email

`tests/Unit/User/Domain/ValueObject/EmailTest.php`

Casos a cubrir:

- email válido
- email inválido
- normalización a lowercase
- trim de espacios

```php
public function testItNormalizesEmail(): void
{
    $email = Email::fromString(
        '  JOHN@EXAMPLE.COM '
    );

    self::assertSame(
        'john@example.com',
        $email->value()
    );
}
```

### UserId Value Object

`src/User/Domain/ValueObject/UserId.php`

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

### User Entity

`src/User/Domain/Entity/User.php`

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

Con esto, el dominio ya está completo y no depende de nada externo. En la próxima lección construimos la capa de aplicación que lo orquesta.
