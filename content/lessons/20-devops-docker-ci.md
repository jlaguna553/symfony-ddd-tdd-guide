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

Esto automatiza una regla arquitectónica. En vez de decir "Por favor, no importes Doctrine aquí", el CI puede decir `ARCHITECTURE VIOLATION`. Mucho más efectivo.

### Architecture as Code

Una arquitectura fuerte combina: DDD + Tests + PHPStan + Deptrac + CI.

Los límites arquitectónicos dejan de ser documentación solamente. Se convierten en **reglas ejecutables**.

### Testing de arquitectura

Idealmente CI debe detectar `Domain → Doctrine` o `Domain → Symfony Controller` como error. Eso puede hacerse mediante Deptrac u otra herramienta equivalente.
