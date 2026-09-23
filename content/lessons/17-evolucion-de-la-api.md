---
slug: "evolucion-de-la-api"
order: 17
module: "concurrencia"
title: "Evolución de la API"
summary: "Cómo escalaría el CRUD: paginación, filtrado, ordenamiento y paginación por cursor para volúmenes grandes — con un sketch de implementación, no solo la idea."
objectives:
  - "Evolucionar ListUsersQuery para soportar paginación sin tocar el dominio."
  - "Ver por qué cambiar un puerto (UserRepository) obliga a actualizar todos sus adaptadores, incluyendo el Fake de testing."
  - "Ubicar filtrado y ordenamiento en Application, nunca leyendo $_GET dentro del Domain."
  - "Conocer cuándo cursor pagination es preferible a OFFSET."
newFiles: []
---

### Pagination

El `findAll()` actual funciona para un ejercicio pequeño, pero 10,000,000 de usuarios ya no. La API debería evolucionar a:

```
GET /api/users?page=1&limit=20
```

Primero, la Query gana parámetros con valores por defecto razonables:

```php
final readonly class ListUsersQuery
{
    public function __construct(
        public int $page = 1,
        public int $limit = 20
    ) {}
}
```

Pero el cambio no se queda en Application. `findAll()` en el puerto `UserRepository` no tiene forma de expresar "dame la página 2 de 20" — así que el puerto mismo cambia:

```php
interface UserRepository
{
    // ...
    public function findPage(int $page, int $limit): array;
}
```

Y aquí está el punto que de verdad importa: **cambiar una interfaz de dominio obliga a actualizar cada clase que la implementa.** No solo `DoctrineUserRepository` —también `InMemoryUserRepository`, o tus Application Tests dejan de compilar.

```php
// DoctrineUserRepository
public function findPage(int $page, int $limit): array
{
    return $this->entityManager
        ->getRepository(User::class)
        ->createQueryBuilder('u')
        ->setFirstResult(($page - 1) * $limit)
        ->setMaxResults($limit)
        ->getQuery()
        ->getResult();
}
```

```php
// InMemoryUserRepository
public function findPage(int $page, int $limit): array
{
    return array_slice(array_values($this->users), ($page - 1) * $limit, $limit);
}
```

`ListUsersHandler` cambia mínimamente — solo pasa los parámetros de la Query al Repository en vez de pedir todo:

```php
public function __invoke(ListUsersQuery $query): array
{
    return array_map(
        static fn ($user) => UserResponse::fromEntity($user),
        $this->users->findPage($query->page, $query->limit)
    );
}
```

> **✏️ Ejercicio —** Implementa `findPage()` en ambas clases como se muestra arriba, actualiza `ListUsersHandlerTest` (lección de [Capa de Aplicación](/lecciones/capa-de-aplicacion)) para que cree, por ejemplo, 5 usuarios y pida `findPage(1, 2)`, comprobando que devuelve exactamente 2. Ese test sigue corriendo contra el Fake, sin MySQL — y si además tienes un Integration Test para `DoctrineUserRepository`, agrégale un caso equivalente para confirmar que el `OFFSET`/`LIMIT` real de MySQL se comporta igual que tu Fake. Ese par de tests (uno rápido contra el Fake, uno lento contra MySQL) es exactamente la razón por la que separamos Application Tests de Integration Tests desde el principio.

### Filtering

```
GET /api/users?email=john
```

Podemos introducir `UserFilter` en Application. No deberíamos meter `$_GET` dentro del Domain — el controller lee los query params y arma un objeto explícito (`new ListUsersQuery(page: ..., email: ...)`), y de ahí para adentro nadie vuelve a tocar la superglobal.

### Sorting

```
GET /api/users?sort=name&direction=asc
```

Application puede traducir esto a `UserSort`. La Infrastructure sabe cómo convertirlo en Doctrine QueryBuilder (`->orderBy('u.name', 'ASC')`).

### Pagination avanzada (cursor)

Para grandes volúmenes puede ser mejor **cursor pagination** en lugar de `OFFSET`:

```
GET /api/users?after=uuid&limit=20
```

Esto puede ser más eficiente en ciertos escenarios de gran escala, porque `OFFSET 500000` obliga a la base de datos a recorrer y descartar 500,000 filas antes de devolver la página; un cursor basado en `WHERE id > :after ORDER BY id LIMIT :limit` usa el índice directamente y no paga ese costo, sin importar en qué página estés.
