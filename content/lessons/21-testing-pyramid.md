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

Esta es la lista completa de casos que un CRUD "bien probado" debería cubrir. Los que ya escribiste con código real en lecciones anteriores están marcados con ✓; el resto quedó como ejercicio explícito en su lección correspondiente.

**Domain** — [Capa de Dominio](/lecciones/capa-de-dominio)
- Email válido ✓
- Email inválido ✓
- Normalización ✓
- UserId válido ✓
- UserId inválido ✓
- Crear User ✓
- Nombre vacío ✓
- Actualizar User ✓
- Nombre vacío al actualizar ✓

**Application** — [Capa de Aplicación](/lecciones/capa-de-aplicacion)
- Create ✓
- Duplicate email ✓
- Get ✓
- Not found ✓
- List ✓
- Update (ejercicio guiado)
- Update not found (ejercicio guiado)
- Update duplicate email (ejercicio guiado)
- Delete (ejercicio guiado)
- Delete not found (ejercicio guiado)

**Integration** — [Estrategia de Testing](/lecciones/estrategia-de-testing)
- Persist ✓
- Reload (`clear()`) ✓
- Find by ID
- Find by email
- Find all
- Update
- Delete
- Unique constraint (ejercicio en [Integridad y concurrencia](/lecciones/integridad-y-concurrencia))
- Custom DBAL types

**Functional** — [Controllers](/lecciones/controllers-http) y [Functional Tests](/lecciones/functional-tests)
- POST 201 ✓ / 400 (ejercicio) / 409 ✓
- GET 200 ✓ / 404 ✓ / invalid ID ✓
- PUT 204 ✓ / 404 ✓ / 409 (ejercicio)
- DELETE 204 ✓ / 404 ✓

> **✏️ Ejercicio —** Los ítems de Integration sin marcar (`find by email`, `find all`, `update`, `delete`, `custom DBAL types`) siguen el mismo `KernelTestCase` que ya tienes en `DoctrineUserRepositoryTest` — solo cambia qué método del repositorio ejercitas y qué afirmas después. Complétalos ahora; es la forma más rápida de comprobar que de verdad entendiste por qué el `clear()` importaba.

Si en algún momento un reviewer te pregunta "¿cómo sabes que está bien probado?", esta matriz — completa — es la respuesta.
