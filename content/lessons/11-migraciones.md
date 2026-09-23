---
slug: "migraciones"
order: 11
module: "infraestructura"
title: "Migraciones"
summary: "Generamos y ejecutamos la migración que crea la tabla users, con su constraint UNIQUE sobre email — y cómo revertirla si algo sale mal."
objectives:
  - "Generar una migración a partir del mapping de Doctrine y revisar su contenido antes de ejecutarla."
  - "Reconocer la forma esperada del SQL resultante, incluyendo el UNIQUE INDEX sobre email."
  - "Saber cómo revertir (rollback) una migración ya ejecutada."
newFiles:
  - "migrations/Version20240101000000.php"
---

### Generar la migración

```bash
php bin/console doctrine:migrations:diff
```

Esto no toca la base de datos todavía — solo compara el mapping (`User.orm.xml`) contra el esquema actual y **genera un archivo PHP** dentro de `migrations/`, algo como `migrations/Version20240101000000.php`, con dos métodos:

```php
public function up(Schema $schema): void
{
    // el SQL que aplica el cambio
}

public function down(Schema $schema): void
{
    // el SQL que lo deshace
}
```

**Antes de ejecutarla, ábrela y léela.** El `diff` es una herramienta, no un oráculo: puede generar un `up()` razonable pero un `down()` incompleto, o incluir un cambio que no esperabas si el mapping tenía algo distinto a lo que creías. Revisar el archivo generado antes de aplicarlo es parte del flujo, no un paso opcional para paranoicos.

Cuando el contenido se vea correcto, aplícala:

```bash
php bin/console doctrine:migrations:migrate
```

La migración debe crear algo conceptualmente similar a:

```sql
CREATE TABLE users (
    id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    UNIQUE INDEX UNIQ_USERS_EMAIL (email),
    PRIMARY KEY(id)
);
```

El SQL exacto dependerá de la plataforma y configuración, pero el `UNIQUE INDEX` sobre `email` no es opcional — en la lección de [integridad y concurrencia](/lecciones/integridad-y-concurrencia) vas a ver por qué la base de datos, y no solo la aplicación, debe garantizar esa unicidad.

### Revertir una migración

Toda migración que escribas debería poder deshacerse. Para volver atrás:

```bash
php bin/console doctrine:migrations:migrate prev
```

Esto ejecuta el `down()` de la última migración aplicada. Es exactamente lo que se ejecutaría en producción si un deployment necesita revertirse — por eso un `down()` vacío o mal escrito no es un detalle menor: es una migración que solo puede avanzar, nunca retroceder de forma segura.

> **✏️ Ejercicio —** Ejecuta `doctrine:migrations:migrate prev` ahora mismo, confirma con `doctrine:migrations:status` que la tabla `users` desapareció, y vuelve a aplicar la migración con `doctrine:migrations:migrate`. Este pequeño ida-y-vuelta es la misma comprobación que querrás automatizar en CI antes de confiar en cualquier migración.
