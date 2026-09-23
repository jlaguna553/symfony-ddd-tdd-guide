---
slug: "tdd-red-green-refactor"
order: 6
module: "arranque"
title: "TDD: la regla RED → GREEN → REFACTOR"
summary: "La disciplina que vamos a seguir en cada pieza del proyecto: primero el test que falla, después la implementación mínima, después el refactor. Con un ejemplo mínimo que puedes correr tú mismo."
objectives:
  - "Interiorizar el ciclo RED → GREEN → REFACTOR con un ejemplo real que corres tú mismo, no solo lees."
  - "Reconocer cómo se ve un test fallando (RED) y uno pasando (GREEN) en la salida de PHPUnit."
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
2. Después escribimos la implementación mínima para que pase.
3. Después hacemos refactor, con la seguridad de que el test te avisa si rompes algo.

Antes de aplicar esto a Value Objects y entidades reales, vale la pena verlo funcionar con algo trivial — así reconoces la salida de PHPUnit en cada fase y no te distraes con las reglas de negocio.

### Un ejemplo mínimo, de principio a fin

Imagina que quieres una clase `Calculator` con un método `add()`. Nada de dominio todavía, solo el ciclo.

**Paso 1 — RED: escribe el test primero, sin que la clase exista.**

```php
<?php

use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    public function testItAddsTwoNumbers(): void
    {
        $calculator = new Calculator();

        self::assertSame(5, $calculator->add(2, 3));
    }
}
```

Corre ese test ahora mismo, aunque `Calculator` no exista todavía:

```bash
php bin/phpunit tests/CalculatorTest.php
```

Vas a ver algo como esto:

```
There was 1 error:

1) CalculatorTest::testItAddsTwoNumbers
Error: Class "Calculator" not found

FAILURES!
Tests: 1, Assertions: 0, Errors: 1.
```

Eso es **RED**. No es un fracaso — es el punto de partida correcto. El test te está diciendo exactamente qué falta.

**Paso 2 — GREEN: la implementación mínima para que pase.**

```php
<?php

final class Calculator
{
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

Corre el test otra vez:

```bash
php bin/phpunit tests/CalculatorTest.php
```

```
OK (1 test, 1 assertion)
```

Eso es **GREEN**. El test pasa con la implementación más simple posible — no adivinamos requisitos futuros, no agregamos `subtract()` ni `multiply()` porque "seguro los vamos a necesitar".

**Paso 3 — REFACTOR.** Con un solo método no hay mucho que refactorizar todavía, pero la regla es: cualquier cambio de diseño que hagas ahora está protegido por el test. Si en el refactor rompes el comportamiento, `add()` te lo dice inmediatamente al volver a correr el test.

### Por qué importa este orden

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

Cuando escribes el código primero y el test después, el test tiende a describir lo que el código *ya hace*, no lo que *debería* hacer — y es fácil que confirme un bug en vez de detectarlo. Cuando el test va primero, te obliga a decidir el comportamiento esperado antes de tener la tentación de acomodarlo a lo que ya escribiste.

### Ejercicio rápido

Antes de seguir a la próxima lección, agrega un segundo test a `CalculatorTest` para un método `subtract()` que todavía no existe, confirma que falla (RED), impleméntalo, y confirma que pasa (GREEN). No hace falta que conserves este archivo — es solo para que el ciclo quede en tus manos, no solo en tus ojos.

A partir de la próxima lección vas a repetir exactamente este mismo ciclo, pieza por pieza, sobre el dominio real: `Email`, `UserId`, `User` y cada Handler. Cada vez que veas un bloque de test en las siguientes lecciones, la instrucción implícita es la misma: **cópialo, corre `phpunit`, mira el error, y solo entonces sigue leyendo la implementación.**
