---
slug: "estrategia-de-testing"
order: 12
module: "infraestructura"
title: "Estrategia de Testing"
summary: "Por qué un InMemory Repository no basta, cómo aislar una base de datos exclusiva para tests y el primer Integration Test real contra MySQL."
objectives:
  - "Configurar una base de datos y un .env.test.local exclusivos para testing."
  - "Escribir un Integration Test que persiste y recupera un User a través de Doctrine real."
  - "Elegir una estrategia de aislamiento entre tests (limpieza de tablas vs. transacciones)."
  - "Distinguir con precisión qué prueba cada capa: Unit, Application e Integration."
newFiles:
  - ".env.test.local"
  - "config/packages/test/doctrine.yaml"
  - "tests/Integration/User/Infrastructure/Persistence/Doctrine/DoctrineUserRepositoryTest.php"
---

### Punto crítico: Integration Tests reales

Aquí empieza una diferencia importante. Un test con `InMemoryUserRepository` no demuestra que Doctrine funcione. Por eso necesitamos:

```flow
Integration Test
Symfony Kernel
Doctrine
MySQL real
```

### Una nota sobre TDD aquí

En las lecciones de Dominio y Aplicación, el test siempre nació **antes** que el código: lo corrías, veías RED, y solo entonces escribías la implementación. En esta lección el orden se invierte un poco — el mapping XML, los tipos DBAL y `DoctrineUserRepository` ya quedaron construidos en la lección anterior, así que cuando llegues al Integration Test más abajo, es probable que pase en verde a la primera.

Eso no es una traición al método: para un test de integración, el RED honesto no es "la clase no existe" sino "la infraestructura no está bien conectada" — mapping incorrecto, tipo DBAL mal registrado, columna con el nombre equivocado. Si quieres ver ese RED con tus propios ojos, hazlo ahora: comenta temporalmente la línea `<field name="email" ...>` en `User.orm.xml`, corre el test de esta lección, y confirma que falla con un error de Doctrine. Después descomenta la línea y vuelve a correrlo — ese es tu GREEN real para esta capa.

### Crear base de datos de test

Nunca deberíamos usar `ddd_symfony` para tests. Crear:

```sql
CREATE DATABASE ddd_symfony_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### `.env.test.local`

```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/ddd_symfony_test?serverVersion=8.0&charset=utf8mb4"
```

Importante: `.env.test.local` **no debe entrar a Git**. En `.gitignore`:

```
.env.local
.env.*.local
```

### ¿Por qué una DB separada?

Porque queremos evitar `tests → development data` y, obviamente, `tests → production data`.

> Eso sería una receta bastante creativa para una reunión incómoda. 😅

La configuración de tests debe ser explícita.

### Configuración Doctrine para test

`config/packages/test/doctrine.yaml`

```yaml
doctrine:
    dbal:
        url: '%env(resolve:DATABASE_URL)%'
        use_savepoints: true

    orm:
        auto_generate_proxy_classes: true
```

Cuando ejecutamos `APP_ENV=test`, Symfony carga `.env`, `.env.test` y `.env.test.local` según la configuración del proyecto.

### Crear esquema de test

Rápido:

```bash
php bin/console doctrine:schema:create --env=test
```

Recomendado para un proyecto serio (probar migraciones):

```bash
php bin/console doctrine:migrations:migrate \
    --env=test \
    --no-interaction
```

La idea es que CI pueda reproducir el esquema de producción desde cero.

### ¿Por qué probar migraciones?

Porque no basta con que `Entity → Doctrine` funcione. Queremos comprobar `Migration → Database` también. Una migración rota puede significar un deployment roto.

### Integration Test

`tests/Integration/User/Infrastructure/Persistence/Doctrine/DoctrineUserRepositoryTest.php`

```php
<?php

namespace App\Tests\Integration\User\Infrastructure\Persistence\Doctrine;

use App\User\Domain\Entity\User;
use App\User\Domain\ValueObject\Email;
use App\User\Domain\ValueObject\UserId;
use App\User\Infrastructure\Persistence\Doctrine\Repository\DoctrineUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class DoctrineUserRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private DoctrineUserRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();

        $this->em = static::getContainer()
            ->get(EntityManagerInterface::class);

        $this->repository = new DoctrineUserRepository($this->em);
    }

    public function testItPersistsAndFindsAUser(): void
    {
        $user = User::create(
            UserId::generate(),
            Email::fromString('test@example.com'),
            'John Doe'
        );

        $this->repository->save($user);

        $this->em->clear();

        $found = $this->repository->findById($user->id());

        self::assertNotNull($found);

        self::assertSame('test@example.com', $found->email()->value());

        self::assertSame('John Doe', $found->name());
    }
}
```

### ¿Por qué `clear()`?

```php
$this->em->clear();
```

Sin ella, Doctrine podría devolverte una entidad que ya tenía en memoria (Identity Map). Queremos demostrar:

```flow
save
MySQL
clear EntityManager
find
MySQL
hydrate User
```

Eso hace mucho más fuerte el Integration Test.

### Casos de Integration Tests

No te quedes solamente con `save + find`. Prueba:

- save
- findById
- findByEmail
- findAll
- update
- delete
- duplicate email
- reload after clear
- custom UserId type
- custom Email type

### Aislamiento de Integration Tests

**Opción 1: limpiar tablas** (proyecto pequeño)

```php
protected function cleanDatabase(): void
{
    $this->em
        ->getConnection()
        ->executeStatement('DELETE FROM users');
}

protected function setUp(): void
{
    self::bootKernel();

    $this->em = static::getContainer()
        ->get(EntityManagerInterface::class);

    $this->cleanDatabase();
}
```

Sencillo, aunque con muchas tablas se vuelve tedioso.

**Opción 2: transacciones**

```flow
BEGIN
test
ROLLBACK
```

Cada test puede modificar la DB y después se revierte todo. Ventajas: rápido, aislado, no necesitas borrar manualmente todas las tablas.

Cuidado si el código bajo prueba: abre transacciones internas, usa varias conexiones, lanza procesos externos, publica mensajes, o ejecuta operaciones fuera de la conexión transaccional.

**Opción 3: herramienta especializada**

En proyectos grandes puedes usar herramientas de testing que manejan aislamiento de DB/transacciones. La elección depende de: cantidad de tablas, concurrencia, mensajería, transacciones, paralelismo, tiempo de ejecución.

Para nuestro proyecto educativo: **DB exclusiva + limpieza controlada** es suficiente.

### Tests Unitarios

```bash
php bin/phpunit tests/Unit
```

Los que ya escribiste en la lección de [Capa de Dominio](/lecciones/capa-de-dominio): Email, UserId, User. No deben requerir: MySQL, Symfony Kernel, Doctrine.

### Tests Application

```bash
php bin/phpunit tests/Application
```

Los que ya escribiste en la lección de [Capa de Aplicación](/lecciones/capa-de-aplicacion): CreateUserHandler, GetUserHandler, ListUsersHandler, UpdateUserHandler, DeleteUserHandler. Usan el Fake `InMemoryUserRepository`, nunca Doctrine.

### Tests Integration

```bash
APP_ENV=test php bin/phpunit tests/Integration
```

Estos sí requieren MySQL y verifican: Doctrine, Mapping, DBAL types, SQL, constraints, hydration.

### Tests Functional

Los Functional Tests prueban:

```flow
HTTP
Symfony
Controller
Application
Doctrine
MySQL
```

Usamos `WebTestCase` — pero antes necesitamos Controllers. Eso es lo que sigue.
