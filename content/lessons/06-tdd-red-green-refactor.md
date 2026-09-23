---
slug: "tdd-red-green-refactor"
order: 6
module: "arranque"
title: "TDD: la regla RED → GREEN → REFACTOR"
summary: "La disciplina que vamos a seguir en cada pieza del proyecto: primero el test que falla, después la implementación mínima, después el refactor."
objectives:
  - "Interiorizar el ciclo RED → GREEN → REFACTOR antes de escribir la primera línea de dominio."
  - "Entender por qué escribir 100 archivos y testear después no es TDD."
newFiles: []
---

Todo el desarrollo debe seguir:

```flow
RED
GREEN
REFACTOR
```

1. Primero escribimos un test que falla.
2. Después escribimos la implementación mínima.
3. Después hacemos refactor.

```flow
Test
FAIL
Implementación
PASS
Refactor
```

No queremos hacer:

```flow
100 archivos de código
ahora vamos a ver cómo los testeamos
```

A partir de la próxima lección vas a ver este ciclo aplicado de verdad: cada Value Object, cada Handler y cada Controller nace de un test que primero falla.
