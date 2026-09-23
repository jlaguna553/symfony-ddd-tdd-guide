---
slug: "migraciones"
order: 11
module: "persistencia"
title: "Migraciones"
summary: "Generamos y ejecutamos la migración que crea la tabla users, con su constraint UNIQUE sobre email."
objectives:
  - "Generar una migración a partir del mapping de Doctrine."
  - "Reconocer la forma esperada del SQL resultante, incluyendo el UNIQUE INDEX sobre email."
newFiles:
  - "migrations/Version20240101000000.php"
---

```bash
php bin/console doctrine:migrations:diff
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
