---
slug: "infraestructura-doctrine"
order: 10
module: "infraestructura"
title: "Persistencia con Doctrine"
summary: "Empieza la Capa de Infraestructura: tipos DBAL personalizados para UserId y Email, mapping XML, el adaptador DoctrineUserRepository y la inyección de dependencias."
objectives:
  - "Ubicar qué entra dentro de Infrastructure y qué no, antes de escribir la primera línea."
  - "Crear tipos DBAL personalizados para que Doctrine hidrate directamente Value Objects."
  - "Mapear la entidad User con XML sin anotaciones dentro de la clase de dominio."
  - "Implementar DoctrineUserRepository como adaptador del puerto UserRepository."
  - "Conectar el puerto con el adaptador vía inyección de dependencias en services.yaml."
newFiles:
  - "src/User/Infrastructure/Persistence/Doctrine/Type/UserIdType.php"
  - "src/User/Infrastructure/Persistence/Doctrine/Type/EmailType.php"
  - "src/User/Infrastructure/Persistence/Doctrine/Mapping/User.orm.xml"
  - "src/User/Infrastructure/Persistence/Doctrine/Repository/DoctrineUserRepository.php"
---

### Dónde empieza esta capa y qué engloba

Domain y Application quedaron completos sin saber que Symfony, Doctrine o MySQL existen. Esta es la tercera y última capa — **Infrastructure** — y es, literalmente, la carpeta `src/User/Infrastructure/` del [plano del proyecto](/lecciones/estructura-del-proyecto):

```tree
!files
Infrastructure
  Http
    Controller
    Exception
  Persistence
    Doctrine
      Mapping
      Repository
      Type
```

Dos responsabilidades, no una: **Persistence** (cómo hablamos con MySQL a través de Doctrine) y **Http** (cómo hablamos con el mundo exterior a través de peticiones). Ambas son "detalles" en el sentido de la lección de [arquitectura final](/lecciones/arquitectura-final) — el dominio no sabe que existen, pero alguien tiene que implementarlas para que la aplicación sirva de algo.

Este módulo recorre ambas mitades en orden — primero Persistence, después Http — y en cada una construimos la pieza y después el test que demuestra que funciona contra el sistema real (MySQL o un servidor HTTP), no contra un doble de prueba:

```flow
Persistencia con Doctrine
Migraciones
Estrategia de Testing (Integration Tests)
Controllers HTTP
Manejo de errores
Functional Tests
```

Empezamos por Persistence, porque sin ella no hay nada que un Controller pueda exponer todavía.

### ¿Por qué necesitamos tipos DBAL personalizados?

Doctrine sabe convertir columnas SQL en tipos nativos de PHP: `VARCHAR` en `string`, `INT` en `int`. Lo que no sabe, de fábrica, es convertir un `VARCHAR` en un objeto `Email` o `UserId` — esos tipos no existen para Doctrine, son conceptos de **nuestro** dominio.

Sin un tipo personalizado, tendrías dos caminos malos: mapear `email` como un `string` plano en la entidad (y entonces `User` ya no usaría el Value Object `Email` con su validación, perdiendo justo lo que construimos en la lección de dominio), o convertir manualmente en el repositorio cada vez que lees o escribes (código repetido y fácil de olvidar en un lugar). Un `Type` de Doctrine resuelve esto una sola vez: le enseña a Doctrine a hidratar `Email`/`UserId` automáticamente en ambas direcciones, para que la entidad de dominio nunca necesite saber que existe una fila de base de datos detrás.

### Doctrine Custom Type: UserId

`src/User/Infrastructure/Persistence/Doctrine/Type/UserIdType.php`

```php
<?php

namespace App\User\Infrastructure\Persistence\Doctrine\Type;

use App\User\Domain\ValueObject\UserId;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Type;

final class UserIdType extends Type
{
    public const NAME = 'user_id';

    public function getSQLDeclaration(
        array $column,
        AbstractPlatform $platform
    ): string {
        return $platform->getGuidTypeDeclarationSQL($column);
    }

    public function convertToPHPValue(
        $value,
        AbstractPlatform $platform
    ): ?UserId {
        if ($value === null) {
            return null;
        }

        return UserId::fromString($value);
    }

    public function convertToDatabaseValue(
        $value,
        AbstractPlatform $platform
    ): ?string {
        if ($value === null) {
            return null;
        }

        if (!$value instanceof UserId) {
            throw new \InvalidArgumentException('Expected UserId.');
        }

        return $value->value();
    }

    public function getName(): string
    {
        return self::NAME;
    }

    public function requiresSQLCommentHint(
        AbstractPlatform $platform
    ): bool {
        return true;
    }
}
```

### Doctrine Custom Type: Email

```php
<?php

namespace App\User\Infrastructure\Persistence\Doctrine\Type;

use App\User\Domain\ValueObject\Email;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Type;

final class EmailType extends Type
{
    public const NAME = 'email';

    public function getSQLDeclaration(
        array $column,
        AbstractPlatform $platform
    ): string {
        return $platform->getStringTypeDeclarationSQL($column);
    }

    public function convertToPHPValue(
        $value,
        AbstractPlatform $platform
    ): ?Email {
        if ($value === null) {
            return null;
        }

        return Email::fromString($value);
    }

    public function convertToDatabaseValue(
        $value,
        AbstractPlatform $platform
    ): ?string {
        if ($value === null) {
            return null;
        }

        if (!$value instanceof Email) {
            throw new \InvalidArgumentException('Expected Email.');
        }

        return $value->value();
    }

    public function getName(): string
    {
        return self::NAME;
    }

    public function requiresSQLCommentHint(
        AbstractPlatform $platform
    ): bool {
        return true;
    }
}
```

### Doctrine XML Mapping

`src/User/Infrastructure/Persistence/Doctrine/Mapping/User.orm.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>

<doctrine-mapping
    xmlns="http://doctrine-project.org/schemas/orm/doctrine-mapping"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="
        http://doctrine-project.org/schemas/orm/doctrine-mapping
        https://www.doctrine-project.org/schemas/orm/doctrine-mapping.xsd
    ">

    <entity
        name="App\User\Domain\Entity\User"
        table="users"
    >

        <id
            name="id"
            type="user_id"
            column="id"
        />

        <field
            name="email"
            type="email"
            column="email"
            length="255"
            unique="true"
        />

        <field
            name="name"
            type="string"
            column="name"
            length="150"
        />

    </entity>

</doctrine-mapping>
```

### Doctrine configuration

`config/packages/doctrine.yaml`

```yaml
doctrine:
    dbal:
        types:
            user_id: App\User\Infrastructure\Persistence\Doctrine\Type\UserIdType
            email: App\User\Infrastructure\Persistence\Doctrine\Type\EmailType

    orm:
        auto_generate_proxy_classes: true

        mappings:
            User:
                type: xml
                is_bundle: false
                dir: '%kernel.project_dir%/src/User/Infrastructure/Persistence/Doctrine/Mapping'
                prefix: 'App\User\Domain\Entity'
                alias: User
```

### Doctrine Repository

```php
<?php

namespace App\User\Infrastructure\Persistence\Doctrine\Repository;

use App\User\Domain\Entity\User;
use App\User\Domain\Repository\UserRepository;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;
use Doctrine\ORM\EntityManagerInterface;

final class DoctrineUserRepository implements UserRepository
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function save(User $user): void
    {
        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }

    public function findById(UserId $id): ?User
    {
        return $this->entityManager
            ->getRepository(User::class)
            ->find($id);
    }

    public function findByEmail(Email $email): ?User
    {
        return $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['email' => $email]);
    }

    public function findAll(): array
    {
        return $this->entityManager
            ->getRepository(User::class)
            ->findAll();
    }

    public function delete(User $user): void
    {
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }
}
```

### Dependency Injection

`config/services.yaml`:

```yaml
services:
    App\User\Domain\Repository\UserRepository:
        alias: App\User\Infrastructure\Persistence\Doctrine\Repository\DoctrineUserRepository
```

Entonces:

```php
public function __construct(
    UserRepository $users
) {}
```

automáticamente recibe `DoctrineUserRepository`. Este es el momento exacto donde el patrón Puerto/Adaptador deja de ser teoría: el dominio pidió una interfaz, y el contenedor de Symfony decidió con qué implementación satisfacerla.

### Verificar Doctrine

```bash
php bin/console doctrine:mapping:info
```

Debemos ver `App\User\Domain\Entity\User`.

```bash
php bin/console doctrine:schema:validate
```

> Si algo falla aquí, no continúes con migraciones ni tests. Primero corrige el mapping.
