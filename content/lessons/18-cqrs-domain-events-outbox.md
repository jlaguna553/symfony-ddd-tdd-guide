---
slug: "cqrs-domain-events-outbox"
order: 18
module: "avanzada"
title: "CQRS, Domain Events y Outbox"
summary: "Ya usamos una versión ligera de CQRS. Vemos cómo evolucionaría hacia Domain Events, Integration Events y el patrón Outbox."
objectives:
  - "Entender que CQRS no implica automáticamente dos bases de datos."
  - "Modelar un Domain Event y distinguirlo de un Integration Event."
  - "Explicar el problema que resuelve el patrón Outbox entre un commit de base de datos y la publicación de un mensaje."
newFiles: []
---

### CQRS

Ya estamos usando una versión ligera de CQRS: `Command → modifica estado` y `Query → consulta estado`. Esto **no** significa automáticamente dos bases de datos. CQRS puede ser solamente separación conceptual.

### CQRS avanzado

Inicialmente:

```compare
# Command
mismo MySQL
---
# Query
mismo MySQL
```

Más adelante podría evolucionar a:

```compare
# Write Model
MySQL
---
# Read Model
Read DB
```

Pero no debes introducir esa complejidad sin necesidad.

### Domain Events

Cuando el dominio crece: `UserCreated`, `UserUpdated`, `UserDeleted` pueden convertirse en Domain Events.

```php
final readonly class UserCreated
{
    public function __construct(
        public UserId $userId,
        public Email $email
    ) {}
}
```

Un evento representa: **algo que ya ocurrió**.

```flow
UserCreated
SendWelcomeEmail
```

Otro componente puede reaccionar a `UserCreated`, sin meter un `Email service` dentro de la entidad `User`.

### Domain Events vs Integration Events

No son exactamente lo mismo.

- **Domain Event**: describe algo ocurrido dentro del dominio.
- **Integration Event**: está pensado para comunicarlo a otros sistemas o bounded contexts.

```flow
UserCreated
Domain Event
Handler
Integration Event
Message Broker
```

### Outbox Pattern

Supongamos: `DB COMMIT + RabbitMQ publish`. Podría pasar que `DB COMMIT` tenga éxito pero `RabbitMQ` falle. Entonces el usuario existe, pero otro sistema nunca recibió el evento.

Con Outbox:

```flow
BEGIN
save User + save OutboxEvent (misma transacción)
COMMIT
```

Después, un worker procesa la cola de eventos pendientes:

```flow
Worker
lee Outbox
publica evento
marca como procesado
```

Esto hace mucho más robusta la integración. Para sistemas distribuidos, `User` y `OutboxMessage` se guardan en una misma transacción; después un worker publica `OutboxMessage` a RabbitMQ, Kafka o SQS según la arquitectura.
