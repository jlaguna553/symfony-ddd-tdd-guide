---
slug: "preguntas-frecuentes"
order: 26
module: "cierre"
title: "Preguntas frecuentes / justificación de decisiones"
summary: "Las respuestas cortas a las preguntas 'por qué' que se acumularon a lo largo de la guía, todas juntas en un solo lugar."
objectives:
  - "Repasar en formato pregunta-respuesta las decisiones de diseño más importantes de la guía."
newFiles: []
---

**¿Por qué Repository interface en Domain?**
Porque el dominio necesita expresar "Quiero guardar User", no "Quiero usar Doctrine EntityManager". Por eso `Domain::UserRepository` y `Infrastructure::DoctrineUserRepository`. Esto permite cambiar la tecnología (Doctrine, MongoDB, API externa, InMemory, otro ORM) sin cambiar el contrato del Domain.

**¿Por qué Integration Tests contra MySQL?**
Porque un InMemory Repository nunca va a detectar: mapping incorrecto, DBAL type incorrecto, unique constraint, SQL incorrecto, hidratación, collation, índices, comportamiento de MySQL. Por eso necesitamos Application Tests **+** Integration Tests, no uno u otro.

**¿Por qué `clear()`?**
Porque `$this->em->clear()` obliga a Doctrine a volver a cargar la entidad. Sin `clear()` existe el riesgo de estar comprobando principalmente el estado que ya vive en memoria. Con `save → clear → find` estamos comprobando realmente `MySQL → Doctrine → Entity`.

**¿Por qué DB de test separada?**
Porque queremos `ddd_symfony` para desarrollo y `ddd_symfony_test` para pruebas. Nunca `test → development` y jamás `test → production`.

**¿Por qué migraciones en test?**
Porque las migraciones son parte del deployment. Si CI puede hacer `DB vacía → migrations → schema correcto`, tenemos una prueba importante de que el despliegue puede reproducirse.

**¿Por qué unique constraint?**
Porque `findByEmail()` no elimina race conditions. La base de datos debe ser la autoridad final sobre la integridad. La combinación correcta es: Application validation + Database constraint.

**¿Por qué ExceptionSubscriber?**
Porque no queremos `try/catch` en cada controller. Queremos `Domain Exception → Infrastructure translator → HTTP Response`. Esto centraliza el contrato.

**¿Por qué controllers delgados?**
Porque el controller debe traducir `HTTP → Application` y `Application → HTTP Response`. No debe ser el lugar donde viven las reglas de negocio.

**¿Qué es realmente DDD aquí?**
No es tener muchas carpetas. DDD significa principalmente: el modelo representa el negocio, y las reglas importantes viven cerca del modelo. Por eso `$user->update(...)` es más significativo que `$user->setName(...)` cuando existen invariantes que deben respetarse.
