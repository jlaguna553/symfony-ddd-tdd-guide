---
slug: "resumen-mental"
order: 30
module: "cierre"
title: "Resumen mental para cualquier nuevo módulo"
summary: "Las ocho preguntas que te vas a hacer cada vez que arranques un módulo nuevo, y el mapa completo de la arquitectura una última vez."
objectives:
  - "Tener un checklist mental de 8 preguntas para arrancar cualquier módulo DDD nuevo."
  - "Revisar el mapa de arquitectura completo con todo lo que ya sabes justificar."
newFiles: []
---

Cuando tengas que crear otro módulo, piensa:

| Pregunta | Capa |
|---|---|
| ¿Qué reglas son del negocio? | Domain |
| ¿Qué caso de uso necesito? | Application |
| ¿Cómo entra la operación? | Infrastructure |
| ¿Cómo persisto? | Infrastructure / Persistence |
| ¿Cómo pruebo las reglas? | Unit Tests |
| ¿Cómo pruebo los casos de uso? | Application Tests |
| ¿Cómo pruebo Doctrine/MySQL? | Integration Tests |
| ¿Cómo pruebo la API? | Functional Tests |

### Arquitectura final (mapa completo)

```architecture
```

Tests:

| Tipo | Qué ejercita |
|---|---|
| Unit | Domain |
| Application | Handlers + InMemory |
| Integration | Doctrine + MySQL |
| Functional | HTTP + Symfony + MySQL |
