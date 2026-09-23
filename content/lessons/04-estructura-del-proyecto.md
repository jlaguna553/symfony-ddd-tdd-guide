---
slug: "estructura-del-proyecto"
order: 4
module: "fundamentos"
title: "Estructura final del proyecto"
summary: "El plano completo de carpetas al que vamos a llegar. Todavía no existe nada de esto: es el destino, no el punto de partida."
objectives:
  - "Memorizar la forma general de un módulo DDD: Domain / Application / Infrastructure."
  - "Ubicar de antemano dónde vivirá cada pieza que construiremos en las próximas lecciones."
newFiles: []
---

Este es el plano al que vamos a llegar. Todavía no existe nada de esto — es la meta, y sirve como mapa de referencia para no perderte en las siguientes lecciones.

```tree
!files
ddd-symfony
  config
    packages
      doctrine.yaml
      framework.yaml
      test
        doctrine.yaml
    services.yaml
  migrations
  src
    Shared
      Domain
        ValueObject
    User
      Domain
        Entity
          User.php
        ValueObject
          Email.php
          UserId.php
        Repository
          UserRepository.php
        Exception
          UserNotFound.php
          UserEmailAlreadyExists.php
      Application
        Command
          CreateUser
          UpdateUser
          DeleteUser
        Query
          GetUser
          ListUsers
        DTO
          UserResponse.php
      Infrastructure
        Http
          Controller
          Exception
        Persistence
          Doctrine
            Mapping
            Repository
            Type
  tests
    Unit
      User
    Application
      User
    Integration
      User
    Functional
      User
    Double
      User
  .env
  .env.test
  .env.test.local
  phpunit.xml.dist
  composer.json
  README.md
```

Fíjate en el patrón que se repite dentro de `src/User/`: **Domain**, **Application**, **Infrastructure**. Ese patrón es el corazón de todo lo que viene. Cuando en el futuro tengas que crear un módulo `Billing` u `Order`, vas a repetir exactamente esta misma forma.

En la próxima lección arrancamos: creamos Symfony desde cero y generamos estas carpetas vacías.
