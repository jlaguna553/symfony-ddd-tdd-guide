---
slug: "devops-docker-ci"
order: 20
module: "operacion"
title: "DevOps: Docker, CI/CD y Architecture as Code"
summary: "Contenerizamos el proyecto, definimos el pipeline de CI y convertimos los límites arquitectónicos en reglas ejecutables con Deptrac."
objectives:
  - "Levantar PHP, Nginx y MySQL con Docker Compose."
  - "Migrar del MySQL local que usaste desde el setup inicial al MySQL en contenedor, sin perder el hilo de lo que ya funcionaba."
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

### Migrar de MySQL local a MySQL en Docker

Desde el [setup inicial](/lecciones/setup-inicial) has estado trabajando contra un MySQL instalado directamente en tu máquina. Ese MySQL nunca deja de funcionar — pero a partir de ahora el proyecto va a hablar con el `mysql` de `compose.yaml`, no con él. Son dos servidores distintos, y moverte de uno a otro tiene tres fricciones concretas que conviene resolver en orden.

**1. El puerto `3306` ya está ocupado.** `compose.yaml` mapea `3306:3306` en tu máquina, pero tu MySQL local ya está escuchando ahí desde la lección 5. `docker compose up` va a fallar con `port is already allocated`. Antes de levantarlo, detén el servicio local:

```bash
# macOS
brew services stop mysql

# Ubuntu/Debian
sudo systemctl stop mysql
```

(Si prefieres no tocar tu MySQL local, la alternativa es cambiar el mapeo a `"3307:3306"` en `compose.yaml` y ajustar el puerto en la `DATABASE_URL` del siguiente paso. Cualquiera de los dos funciona; detener el servicio local es lo más simple mientras trabajas en este proyecto.)

**2. El host de conexión cambia.** Tu `.env` apunta a `127.0.0.1`, que tiene sentido cuando PHP corre directamente en tu máquina. Pero dentro de `compose.yaml`, el contenedor `php` no tiene un `127.0.0.1` propio compartido con MySQL — Docker Compose resuelve el nombre del *servicio* (`mysql`) como si fuera un hostname. Actualiza `.env`:

```
DATABASE_URL="mysql://root:password@mysql:3306/ddd_symfony?serverVersion=8.0&charset=utf8mb4"
```

Solo cambió el host: `127.0.0.1` → `mysql`. Haz lo mismo en `.env.test.local` cuando llegues al paso 4.

**3. La base de datos containerizada nace vacía.** `MYSQL_DATABASE: ddd_symfony` en `compose.yaml` crea la base al arrancar, pero sin ninguna tabla — y sin los datos que tenías en tu MySQL local, que no viaja automáticamente a un contenedor nuevo. Levanta los servicios y vuelve a migrar, esta vez dentro del contenedor:

```bash
docker compose up -d

docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction
```

**4. La base de datos de test necesita el mismo tratamiento — a mano.** `MYSQL_DATABASE` solo crea una base de datos, y la tuya se llama `ddd_symfony_test`. Créala directamente dentro del contenedor de MySQL:

```bash
docker compose exec mysql mysql -uroot -ppassword \
  -e "CREATE DATABASE ddd_symfony_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Actualiza `.env.test.local` igual que en el paso 2 (host `mysql` en vez de `127.0.0.1`) y migra el esquema de test:

```bash
docker compose exec php php bin/console doctrine:migrations:migrate --env=test --no-interaction
```

A partir de aquí, cualquier comando del proyecto —`phpunit`, `bin/console`, lo que sea— corre **dentro** del contenedor `php`, con `docker compose exec php ...` delante. Si vuelves a ejecutar `php bin/phpunit tests/Integration` directamente en tu terminal (fuera de Docker), va a intentar resolver el host `mysql` y fallar, porque ese nombre solo existe dentro de la red que crea `compose.yaml`.

> **✏️ Ejercicio —** Los datos de prueba que hayas creado a mano contra tu MySQL local (usuarios de pruebas manuales, no los que insertan los tests automatizados) no se transfieren solos. Si quisieras conservarlos, la herramienta es `mysqldump`: exporta con `mysqldump -u root -p ddd_symfony > backup.sql` desde tu MySQL local, y carga el resultado dentro del contenedor con `docker compose exec -T mysql mysql -uroot -ppassword ddd_symfony < backup.sql`. Para este proyecto no hace falta —son datos de prueba— pero es exactamente el procedimiento que usarías en un caso real.

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
