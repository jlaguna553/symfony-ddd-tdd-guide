---
slug: "testing-pyramid"
order: 21
module: "operacion"
title: "Testing Pyramid y Test Matrix"
summary: "La forma que deberían tener nuestros tests: muchos rápidos en la base, pocos y caros en la punta. Y la matriz completa de casos por capa."
objectives:
  - "Visualizar la pirámide de testing y qué capa usa (o no) MySQL."
  - "Tener a mano la matriz completa de casos de test por capa como checklist de cobertura."
newFiles: []
---

### Testing Pyramid

```pyramid
```

La idea: muchos tests rápidos, pocos tests caros.

### Qué prueba cada tipo

| Test | Qué prueba | ¿Usa MySQL? |
|---|---|---|
| Unit | Domain | No |
| Application | Use Cases | No |
| Integration | Doctrine + DB | Sí |
| Functional | HTTP completo | Sí |
| E2E | Sistema completo | Sí |

### Test Matrix

**Domain**
- Email válido
- Email inválido
- Normalización
- UserId válido
- UserId inválido
- Crear User
- Nombre vacío
- Actualizar User
- Nombre vacío al actualizar

**Application**
- Create
- Duplicate email
- Get
- Not found
- List
- Update
- Update not found
- Update duplicate email
- Delete
- Delete not found

**Integration**
- Persist
- Reload
- Find by ID
- Find by email
- Find all
- Update
- Delete
- Unique constraint
- Custom DBAL types

**Functional**
- POST 201 / 400 / 409
- GET 200 / 404 / invalid ID
- PUT 204 / 404 / 409
- DELETE 204 / 404

Si en algún momento un reviewer te pregunta "¿cómo sabes que está bien probado?", esta matriz es la respuesta.
