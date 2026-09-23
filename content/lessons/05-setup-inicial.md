---
slug: "setup-inicial"
order: 5
module: "arranque"
title: "Setup inicial: Symfony, MySQL y la estructura DDD"
summary: "Creamos Symfony desde cero, conectamos MySQL y generamos el esqueleto de carpetas vacío. Primer avance real del proyecto."
objectives:
  - "Instalar un proyecto Symfony nuevo con las dependencias que vamos a necesitar."
  - "Configurar la conexión a MySQL en desarrollo."
  - "Generar la estructura de carpetas DDD vacía, lista para recibir código."
newFiles:
  - "composer.json"
  - ".env"
  - ".env.test"
  - "phpunit.xml.dist"
  - "config/packages/doctrine.yaml"
  - "config/packages/framework.yaml"
  - "config/services.yaml"
  - "src/Shared/Domain/ValueObject/"
  - "src/User/Domain/Entity/"
  - "src/User/Domain/ValueObject/"
  - "src/User/Domain/Repository/"
  - "src/User/Domain/Exception/"
  - "src/User/Application/Command/CreateUser/"
  - "src/User/Application/Command/UpdateUser/"
  - "src/User/Application/Command/DeleteUser/"
  - "src/User/Application/Query/GetUser/"
  - "src/User/Application/Query/ListUsers/"
  - "src/User/Application/DTO/"
  - "src/User/Infrastructure/Http/Controller/"
  - "src/User/Infrastructure/Http/Exception/"
  - "src/User/Infrastructure/Persistence/Doctrine/Repository/"
  - "src/User/Infrastructure/Persistence/Doctrine/Mapping/"
  - "src/User/Infrastructure/Persistence/Doctrine/Type/"
  - "tests/Unit/User/Domain/ValueObject/"
  - "tests/Unit/User/Domain/Entity/"
  - "tests/Application/User/Command/CreateUser/"
  - "tests/Application/User/Command/UpdateUser/"
  - "tests/Application/User/Command/DeleteUser/"
  - "tests/Application/User/Query/GetUser/"
  - "tests/Application/User/Query/ListUsers/"
  - "tests/Integration/User/Infrastructure/Persistence/Doctrine/"
  - "tests/Functional/User/"
  - "tests/Double/User/"
---

### Crear Symfony desde cero

Partimos de una carpeta vacía:

```bash
mkdir ddd-symfony
cd ddd-symfony
```

Crear Symfony:

```bash
composer create-project symfony/skeleton .
```

Instalar webapp, Doctrine, UID, Validator y las herramientas de testing:

```bash
composer require webapp
composer require symfony/orm-pack
composer require symfony/uid
composer require symfony/validator
composer require --dev symfony/test-pack
composer require --dev symfony/maker-bundle
```

Comprobar que todo quedó instalado correctamente:

```bash
php bin/console about
php bin/phpunit
```

### Configurar MySQL

Crear la base:

```sql
CREATE DATABASE ddd_symfony
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

En `.env`:

```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/ddd_symfony?serverVersion=8.0&charset=utf8mb4"
```

Probar conexión:

```bash
php bin/console doctrine:query:sql "SELECT 1"
```

### Crear estructura DDD

Con Symfony ya funcionando, generamos todas las carpetas vacías que vimos en el [plano del proyecto](/lecciones/estructura-del-proyecto):

```bash
mkdir -p src/Shared/Domain/ValueObject

mkdir -p src/User/Domain/Entity
mkdir -p src/User/Domain/ValueObject
mkdir -p src/User/Domain/Repository
mkdir -p src/User/Domain/Exception

mkdir -p src/User/Application/Command/CreateUser
mkdir -p src/User/Application/Command/UpdateUser
mkdir -p src/User/Application/Command/DeleteUser

mkdir -p src/User/Application/Query/GetUser
mkdir -p src/User/Application/Query/ListUsers

mkdir -p src/User/Application/DTO

mkdir -p src/User/Infrastructure/Http/Controller
mkdir -p src/User/Infrastructure/Http/Exception

mkdir -p src/User/Infrastructure/Persistence/Doctrine/Repository
mkdir -p src/User/Infrastructure/Persistence/Doctrine/Mapping
mkdir -p src/User/Infrastructure/Persistence/Doctrine/Type

mkdir -p tests/Unit/User/Domain/ValueObject
mkdir -p tests/Unit/User/Domain/Entity

mkdir -p tests/Application/User/Command/CreateUser
mkdir -p tests/Application/User/Command/UpdateUser
mkdir -p tests/Application/User/Command/DeleteUser

mkdir -p tests/Application/User/Query/GetUser
mkdir -p tests/Application/User/Query/ListUsers

mkdir -p tests/Integration/User/Infrastructure/Persistence/Doctrine
mkdir -p tests/Functional/User

mkdir -p tests/Double/User
```

Con esto, el proyecto ya tiene el esqueleto completo. Todavía no hay una sola clase de dominio — eso empieza en la próxima lección, pero antes hay que fijar una disciplina de trabajo: TDD.
