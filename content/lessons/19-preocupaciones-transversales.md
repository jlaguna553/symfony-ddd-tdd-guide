---
slug: "preocupaciones-transversales"
order: 19
module: "avanzada"
title: "Preocupaciones transversales"
summary: "Idempotencia, mensajería asíncrona, seguridad, logs, observabilidad, auditoría y performance: lo que un sistema real necesita además del CRUD."
objectives:
  - "Reconocer cuándo introducir un Idempotency-Key en operaciones críticas."
  - "Separar claramente Authentication de Authorization."
  - "Saber qué información de logs es útil y cuál nunca debe registrarse."
  - "Entender la disciplina correctness → profiling → optimization antes de meter cache."
newFiles: []
---

### Idempotencia

Para operaciones críticas (`POST /payments`, `POST /orders`) un retry podría duplicar una operación. Podemos utilizar un header `Idempotency-Key: 8f31...`. El servidor recuerda que esa operación ya fue procesada. No es necesario para nuestro CRUD básico, pero es un concepto importante de arquitectura distribuida.

### Idempotencia en workers

Si un mensaje llega dos veces (`UserCreated`, `UserCreated`) no queremos 2 emails si el negocio no lo permite. El consumidor debe poder determinar si ya procesó ese evento.

### Mensajería asíncrona y retry

Si una operación no necesita completarse antes de responder:

```flow
POST /users
201
message queue
SendWelcomeEmail
```

puede desacoplarse, reduciendo tiempo de respuesta y permitiendo retries.

Los consumidores deben considerar fallos transitorios (RabbitMQ, SMTP, API externa no disponibles). Un worker robusto puede usar: retry, backoff, dead letter queue.

### Seguridad

```flow
Request
Authentication
Authorization
Application
```

- **Authentication**: ¿Quién eres?
- **Authorization**: ¿Qué puedes hacer?

No son lo mismo.

### Passwords

Nunca `password = "123456"` guardado directamente. Si `User` representa una cuenta autenticable, Symfony ofrece mecanismos para hashear contraseñas. Para este ejercicio dejamos `User` como un usuario de negocio simple — eso mantiene el ejemplo enfocado.

### Logs

Información útil: `request_id`, `operation`, `duration`, `status`, `exception`, `user_id`.

Nunca deberíamos registrar: password, access tokens, secret keys, credenciales, información sensible innecesaria.

### Observabilidad

Una arquitectura madura combina: Logs, Metrics, Traces.

```flow
POST /api/users
Controller
Handler
Repository
MySQL
```

Con tracing puedes seguir toda la operación. En microservicios esto se vuelve especialmente valioso.

### Health Checks

Una aplicación puede exponer `GET /health` para comprobar: application, database, dependencies. En Kubernetes puede ser útil separar **liveness** y **readiness**.

### Auditoría

En sistemas administrativos puede ser importante registrar: who, what, when, from, to. Ejemplo:

```
User email changed
old: john@example.com
new: john2@example.com
actor: admin-123
timestamp: ...
```

Esto puede ser un bounded context o mecanismo transversal según el proyecto.

### Seguridad y autorización (Identity vs User)

No mezcles `User` con `Authentication`/`Authorization` automáticamente. Puedes tener `Identity`, `Access`, `User` como conceptos distintos según el dominio.

### Performance y Cache

No optimices antes de medir: primero **correctness**, después **profiling**, después **optimization**.

Posibles optimizaciones: indexes, pagination, query optimization, hydration strategy, cache, read models, async processing.

No pongas Redis simplemente porque "es arquitectura". Primero identifica: ¿qué consulta es cara?, ¿qué tan frecuente es?, ¿qué tan tolerante es a datos stale? Entonces puedes introducir Redis si realmente resuelve el problema.
