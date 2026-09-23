---
slug: "setup-inicial"
order: 5
module: "arranque"
title: "Setup inicial: Symfony, MySQL y la estructura DDD"
summary: "Antes de instalar nada, verificamos que PHP, Composer y MySQL ya estén en tu máquina. Después creamos Symfony, conectamos MySQL y generamos el esqueleto de carpetas vacío."
objectives:
  - "Verificar que PHP, Composer y MySQL están instalados y en una versión compatible, antes de escribir un solo comando del proyecto."
  - "Entender qué hace composer require/install y para qué sirven composer.json y composer.lock."
  - "Saber entrar a la consola de MySQL y ejecutar SQL desde ahí, no solo copiar el bloque de código."
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

### Antes de empezar: verifica tu entorno

Todo lo que sigue asume tres herramientas ya instaladas en tu máquina: **PHP**, **Composer** y **MySQL**. Antes de copiar el primer comando, confirma que las tienes — es más rápido resolverlo ahora que a mitad de un error críptico tres pasos más adelante.

**PHP.** Necesitas **8.2 o superior** — no es un capricho de versión: las clases `readonly` que vamos a usar desde la lección de [Capa de Dominio](/lecciones/capa-de-dominio) en adelante son una sintaxis de PHP 8.2, y el proyecto simplemente no arranca con una versión menor.

```bash
php -v
```

```
PHP 8.3.6 (cli) (built: ...)
```

Si el comando no existe o la versión es menor a 8.2, instala PHP desde [php.net/downloads](https://www.php.net/downloads) o con el gestor de paquetes de tu sistema (`apt`, `brew`, `dnf`, etc. según corresponda).

**Composer.** Es el gestor de dependencias de PHP — lo vamos a usar en casi cada lección de aquí en adelante.

```bash
composer -V
```

```
Composer version 2.7.x
```

Si no aparece, instálalo desde [getcomposer.org/download](https://getcomposer.org/download/) — el sitio oficial trae un script de instalación de una línea para Linux/macOS y un instalador gráfico para Windows.

**MySQL.** Necesitas un servidor MySQL corriendo y accesible, no solo el cliente de línea de comandos. Primero confirma si ya lo tienes:

```bash
mysql --version
mysqladmin ping
```

La primera confirma que el *cliente* `mysql` está instalado; la segunda confirma que hay un *servidor* escuchando y respondiendo (debería imprimir `mysqld is alive`). Puedes tener el cliente instalado y aun así no tener ningún servidor corriendo — son dos cosas distintas y ambas hacen falta. Si `mysqladmin ping` falla, instala el servidor según tu sistema:

**macOS (Homebrew):**

```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl enable --now mysql
```

Un detalle propio de Ubuntu/Debian: el usuario `root` de MySQL viene configurado para autenticarse por socket Unix, no por contraseña. La primera vez, entra con `sudo mysql` en vez de `mysql -u root -p`. Una vez dentro, puedes crear un usuario con contraseña para el resto de la guía:

```sql
CREATE USER 'root'@'127.0.0.1' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Con eso, `mysql -u root -p` (contraseña `password`) y la `DATABASE_URL` de más abajo funcionan tal cual.

**Windows:** descarga el instalador desde [dev.mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/) — el asistente gráfico te deja fijar la contraseña de `root` durante la instalación, así que no necesitas el paso anterior.

Vuelve a correr `mysqladmin ping` para confirmar que el servidor ya responde antes de seguir.

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

#### ¿Qué hace exactamente `composer require`?

Vas a escribir `composer require` decenas de veces en esta guía, así que vale la pena saber qué hace realmente:

- **`composer require paquete/nombre`** descarga el paquete y lo agrega como dependencia de **producción** en `composer.json` — algo que tu aplicación necesita para funcionar (Doctrine, el propio Symfony).
- **`composer require --dev paquete/nombre`** hace lo mismo pero lo marca como dependencia de **desarrollo** — herramientas que necesitas mientras programas pero que no deberían viajar a producción (PHPUnit vía `test-pack`, el `maker-bundle`, más adelante PHPStan y PHP-CS-Fixer).
- **`composer.json`** es el archivo que declara *qué* necesitas, con rangos de versión flexibles (`^7.0`, por ejemplo).
- **`composer.lock`**, que Composer genera y actualiza automáticamente, congela las versiones *exactas* que se instalaron — es lo que garantiza que tú, tu compañero de equipo y el pipeline de CI instalen exactamente los mismos paquetes, no solo "algo compatible con `^7.0`".
- **`composer install`** (sin argumentos) no agrega nada nuevo: instala exactamente lo que dice `composer.lock`. Es el comando que vas a usar en CI, en la lección de [DevOps](/lecciones/devops-docker-ci) — nunca `composer require` ahí, porque no estás agregando una dependencia nueva, estás reproduciendo las que ya existen.
- **`vendor/`** es la carpeta donde Composer descarga el código de cada paquete. Nunca se versiona en Git (ya viene en el `.gitignore` del skeleton) porque se reconstruye por completo con `composer install`.

### Configurar MySQL

Crear la base:

```sql
CREATE DATABASE ddd_symfony
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Ese bloque es SQL, no un comando de terminal — necesitas ejecutarlo *dentro* de una consola de MySQL. Si nunca entraste a una, así se hace:

```bash
mysql -u root -p
```

Te va a pedir la contraseña de `root` y, si es correcta, tu prompt cambia a algo como:

```
mysql>
```

Ahí dentro, pega el bloque `CREATE DATABASE` de arriba (termina en `;`) y presiona enter. Confirma que se creó:

```sql
SHOW DATABASES;
```

Deberías ver `ddd_symfony` en la lista. Para salir de la consola: `exit` o `\q`.

Si prefieres no entrar a un modo interactivo, el mismo resultado se logra en una sola línea desde tu terminal normal:

```bash
mysql -u root -p -e "CREATE DATABASE ddd_symfony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Un cliente gráfico (TablePlus, DBeaver, MySQL Workbench, la extensión de MySQL de tu editor) funciona exactamente igual y es una alternativa perfectamente válida si te sientes más cómodo ahí — lo único que importa es que la base de datos `ddd_symfony` termine existiendo.

En `.env`:

```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/ddd_symfony?serverVersion=8.0&charset=utf8mb4"
```

Ajusta usuario, contraseña y puerto a los de tu instalación real si son distintos.

Probar conexión, esta vez desde el propio Symfony:

```bash
php bin/console doctrine:query:sql "SELECT 1"
```

Si esto devuelve un resultado en vez de un error de conexión, Symfony y MySQL ya se están hablando — puedes seguir.

Guarda mentalmente cómo quedó esta conexión (usuario, contraseña, `127.0.0.1:3306`): vas a necesitarla tal cual en la lección de [Estrategia de Testing](/lecciones/estrategia-de-testing) para la base de datos de test, y más adelante, en la lección de [DevOps](/lecciones/devops-docker-ci), vas a mover este mismo MySQL a un contenedor Docker — ahí retomamos exactamente este punto.

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
