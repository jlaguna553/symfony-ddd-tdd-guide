---
slug: "evolucion-de-la-api"
order: 17
module: "concurrencia"
title: "Evolución de la API"
summary: "Cómo escalaría el CRUD: paginación, filtrado, ordenamiento y paginación por cursor para volúmenes grandes."
objectives:
  - "Evolucionar ListUsersQuery para soportar paginación sin tocar el dominio."
  - "Ubicar filtrado y ordenamiento en Application, nunca leyendo $_GET dentro del Domain."
  - "Conocer cuándo cursor pagination es preferible a OFFSET."
newFiles: []
---

### Pagination

El `findAll()` actual funciona para un ejercicio pequeño, pero 10,000,000 de usuarios ya no. La API debería evolucionar a:

```
GET /api/users?page=1&limit=20
```

```php
final readonly class ListUsersQuery
{
    public function __construct(
        public int $page = 1,
        public int $limit = 20
    ) {}
}
```

El Repository deberá proporcionar una operación paginada.

### Filtering

```
GET /api/users?email=john
```

Podemos introducir `UserFilter` en Application. No deberíamos meter `$_GET` dentro del Domain.

### Sorting

```
GET /api/users?sort=name&direction=asc
```

Application puede traducir esto a `UserSort`. La Infrastructure sabe cómo convertirlo en Doctrine QueryBuilder.

### Pagination avanzada (cursor)

Para grandes volúmenes puede ser mejor **cursor pagination** en lugar de `OFFSET`:

```
GET /api/users?after=uuid&limit=20
```

Esto puede ser más eficiente en ciertos escenarios de gran escala, porque evita que la base de datos tenga que recorrer y descartar todas las filas anteriores al offset solicitado.
