---
slug: "objetivo"
order: 1
module: "fundamentos"
title: "Objetivo del proyecto"
summary: "Qué vamos a construir y por qué la meta no es un endpoint funcionando, sino poder explicar cada decisión de diseño."
objectives:
  - "Ver la lista completa de piezas que compone el proyecto (dominio, aplicación, infraestructura, testing, CI...)."
  - "Entender que la meta real es poder justificar arquitectónicamente cada pieza, no solo hacerla funcionar."
newFiles: []
---

Vamos a construir una aplicación que tenga:

- Symfony
- PHP
- MySQL
- Doctrine ORM
- DDD por bounded context
- Value Objects
- Entidad de dominio
- Repository Port
- Repository Adapter con Doctrine
- Commands
- Queries
- Handlers
- DTOs
- Controllers HTTP delgados
- Validación de dominio
- Manejo centralizado de errores
- Tests unitarios
- Tests de aplicación
- Tests de integración contra MySQL
- Tests funcionales HTTP
- Base de datos exclusiva para tests
- Migraciones
- CI
- Static analysis
- Architecture tests
- Docker
- Observabilidad
- Conceptos de Domain Events, Outbox y CQRS

La meta **no** es simplemente conseguir `POST /api/users` funcionando.

La meta es poder explicar:

> "Sé por qué cada pieza existe, qué responsabilidad tiene y cómo verifico que los límites arquitectónicos realmente se respetan."

Esa frase es el hilo conductor de toda la guía. Cada lección que sigue existe para poder sostenerla en una conversación técnica real, no solo en el código.
