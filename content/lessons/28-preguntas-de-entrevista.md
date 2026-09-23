---
slug: "preguntas-de-entrevista"
order: 28
module: "cierre"
title: "Preguntas de entrevista Senior / Tech Lead"
summary: "Las diez preguntas que con más probabilidad te van a hacer sobre este proyecto, con la respuesta que deberías poder dar sin dudar."
objectives:
  - "Practicar en voz alta las respuestas a las preguntas de arquitectura más comunes en una entrevista senior."
newFiles: []
---

**¿Por qué Repository Interface en Domain?**
Porque el dominio define la abstracción que necesita y la infraestructura proporciona la implementación. Esto aplica Dependency Inversion y mantiene al dominio desacoplado de Doctrine.

**¿Por qué InMemory Repository?**
Para probar los casos de uso sin depender de infraestructura externa. Así los Application Tests son rápidos, deterministas y enfocados en la lógica del caso de uso.

**¿Por qué Integration Tests con MySQL?**
Porque un InMemory Repository no valida Doctrine, mappings, custom DBAL types, constraints ni comportamiento real de MySQL.

**¿Por qué una base separada?**
Para garantizar aislamiento y evitar que los tests modifiquen datos de desarrollo o, peor todavía, producción.

**¿Por qué `clear()`?**
Para asegurar que la prueba realmente recupere la entidad desde la persistencia y no desde el Identity Map de Doctrine.

**¿Por qué unique constraint?**
Porque la validación previa en Application no elimina race conditions. La base de datos debe garantizar la integridad.

**¿Por qué ExceptionSubscriber?**
Para traducir errores de aplicación/dominio al contrato HTTP de forma centralizada y mantener controllers delgados.

**¿DDD significa microservicios?**
No. DDD puede aplicarse perfectamente a un monolito modular. La separación de bounded contexts puede existir antes de distribuir físicamente el sistema.

**¿CQRS significa dos bases de datos?**
No. CQRS puede ser únicamente la separación entre Commands y Queries. Separar modelos de lectura y escritura físicamente es una evolución adicional.

**¿Cuándo usar Outbox?**
Cuando necesito garantizar que un cambio de base de datos y la publicación eventual de un evento no queden inconsistentes por una falla entre ambos sistemas.
