---
slug: "orden-recomendado"
order: 24
module: "operacion"
title: "Orden recomendado para construir el proyecto"
summary: "El mismo recorrido de esta guía, resumido como una lista de 45 pasos que puedes seguir de memoria en tu próximo proyecto."
objectives:
  - "Tener una checklist secuencial reutilizable para el próximo módulo DDD que construyas desde cero."
newFiles: []
---

```
01. Crear Symfony
02. Configurar MySQL
03. Crear estructura DDD

04. Test Email
05. Implementar Email

06. Test UserId
07. Implementar UserId

08. Test User
09. Implementar User

10. Repository interface
11. InMemory repository

12. Test Create
13. Implementar Create

14. Test Get
15. Implementar Get

16. Test List
17. Implementar List

18. Test Update
19. Implementar Update

20. Test Delete
21. Implementar Delete

22. Doctrine mapping
23. Custom DBAL types
24. Doctrine repository

25. Dependency Injection
26. Migration

27. Crear DB test
28. Configurar .env.test.local

29. Integration tests
30. Aislamiento

31. Controllers
32. Functional tests

33. Exception Subscriber
34. Error contract

35. Pagination
36. Filtering

37. PHPStan
38. CS Fixer
39. Deptrac

40. CI
41. Docker
42. Observability

43. Domain Events
44. Outbox
45. Async Messaging
```

Nota el patrón: **test antes que implementación** se repite en cada bloque (04-05, 06-07, 08-09, 12-13...). No es casualidad — es la misma disciplina RED → GREEN → REFACTOR de la lección 6, aplicada de forma consistente a cada pieza del sistema.
