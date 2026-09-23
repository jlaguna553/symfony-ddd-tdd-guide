---
slug: "devops-docker-ci"
order: 20
module: "operacion"
title: "DevOps: Docker, CI/CD y Architecture as Code"
summary: "Contenerizamos el proyecto, definimos el pipeline de CI y convertimos los límites arquitectónicos en reglas ejecutables con Deptrac."
objectives:
  - "Levantar PHP, Nginx y MySQL con Docker Compose."
  - "Definir un pipeline de CI que corra lint, las cuatro capas de tests y static analysis en orden."
  - "Usar Deptrac para que el CI rechace automáticamente violaciones de arquitectura, no solo un code review."
newFiles:
  - "docker/php/Dockerfile"
  - "docker/nginx/default.conf"
  - "compose.yaml"
  - ".gitignore"
---

### Docker

```tree
!files
docker
  php
    Dockerfile
  nginx
    default.conf
```

`compose.yaml`:

```yaml
services:

  php:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    working_dir: /app
    volumes:
      - .:/app

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - .:/app
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf

  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ddd_symfony
      MYSQL_ROOT_PASSWORD: password
    ports:
      - "3306:3306"
```

Para producción hay que usar una estrategia diferente de filesystem, secrets, networking, imágenes inmutables, etc.

### CI/CD

Pipeline mínimo:

```flow
Checkout
Composer install
Lint
Unit tests
Application tests
Create test DB
Run migrations
Integration tests
Functional tests
Static analysis
Architecture checks
```

```bash
composer install --no-interaction

php bin/console lint:yaml config
php bin/console lint:container

php bin/phpunit tests/Unit
php bin/phpunit tests/Application

php bin/console doctrine:migrations:migrate \
    --env=test \
    --no-interaction

php bin/phpunit tests/Integration
php bin/phpunit tests/Functional
```

Ese mismo pipeline, como workflow de GitHub Actions real:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
          MYSQL_DATABASE: ddd_symfony_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'

      - run: composer install --no-interaction --prefer-dist

      - run: php bin/console lint:yaml config
      - run: php bin/console lint:container

      - run: php bin/phpunit tests/Unit
      - run: php bin/phpunit tests/Application

      - name: Integration + Functional
        env:
          APP_ENV: test
          DATABASE_URL: mysql://root@127.0.0.1:3306/ddd_symfony_test?serverVersion=8.0
        run: |
          php bin/console doctrine:migrations:migrate --no-interaction
          php bin/phpunit tests/Integration
          php bin/phpunit tests/Functional
```

Guárdalo como `.github/workflows/ci.yml`. El servicio `mysql` es lo que hace posible correr Integration y Functional Tests en el runner de GitHub sin instalar MySQL manualmente — es la misma DB de test exclusiva de la lección de [Estrategia de Testing](/lecciones/estrategia-de-testing), solo que ahora vive dentro del pipeline en vez de tu máquina.

### PHPStan

```bash
composer require --dev phpstan/phpstan
```

Objetivo: detectar errores de tipos, por ejemplo: nullable incorrecto, método inexistente, return incorrecto, argumento incompatible. Puedes empezar con un nivel moderado y aumentarlo progresivamente.

### PHP-CS-Fixer

Sirve para automatizar estilo:

```bash
vendor/bin/php-cs-fixer fix
```

Pero recuerda: `formatting ≠ architecture`. Que el código esté bonito no significa que esté bien diseñado.

### Deptrac

Herramienta especialmente interesante para este proyecto. Podemos imponer:

```
Domain       NO → Infrastructure
Domain       NO → Application
Application  NO → Infrastructure
```

Esto se traduce a un archivo de configuración real, `deptrac.yaml`:

```yaml
parameters:
  paths:
    - ./src

  layers:
    - name: Domain
      collectors:
        - type: directory
          value: src/User/Domain/.*
    - name: Application
      collectors:
        - type: directory
          value: src/User/Application/.*
    - name: Infrastructure
      collectors:
        - type: directory
          value: src/User/Infrastructure/.*

  ruleset:
    Domain: []
    Application:
      - Domain
    Infrastructure:
      - Domain
      - Application
```

El `ruleset` se lee "esta capa puede depender de estas otras": `Domain` no puede depender de nada (lista vacía), `Application` solo de `Domain`, e `Infrastructure` de ambas. Corre `vendor/bin/deptrac analyse` y agrégalo como un paso más en el CI de arriba — si algún día un import de `Doctrine\ORM` se cuela dentro de `src/User/Domain/`, este comando falla con un `ARCHITECTURE VIOLATION` explícito, en vez de depender de que alguien lo note en un code review.

### Architecture as Code

Una arquitectura fuerte combina: DDD + Tests + PHPStan + Deptrac + CI.

Los límites arquitectónicos dejan de ser documentación solamente. Se convierten en **reglas ejecutables**.

### Testing de arquitectura

Idealmente CI debe detectar `Domain → Doctrine` o `Domain → Symfony Controller` como error. Eso puede hacerse mediante Deptrac u otra herramienta equivalente.
