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

Imagina que quieres una clase `Calculator` con un método `add()`. Nada de dominio todavía, solo el ciclo. Y antes de escribir una sola línea, dos preguntas muy concretas que vale la pena resolver ahora, porque te las vas a hacer con cada test de esta guía: **¿en qué archivo va cada cosa?** y **¿cómo hace PHP para encontrar una clase que vive en otro archivo?**

#### Dónde vive esto, y por qué no toca el proyecto real

Vamos a crear una carpeta exclusiva para este experimento: `tests/Sandbox/`. Todo lo que pongas ahí queda completamente aislado de `src/` — que es donde vive el código real del proyecto — así que cuando termines el ejercicio puedes borrar la carpeta entera (`rm -rf tests/Sandbox`) sin dejar ningún rastro.

Eso funciona sin configuración extra porque el `composer.json` que generó `symfony/skeleton` ya trae esto en `autoload-dev`:

```json
"autoload-dev": {
    "psr-4": {
        "App\\Tests\\": "tests/"
    }
}
```

Esa línea le dice a Composer: "cualquier clase con namespace `App\Tests\algo` vive físicamente en `tests/algo/`". Es **PSR-4**, el estándar que usa PHP para mapear namespaces a rutas de archivo — y es la razón por la que nunca vas a ver un `require` o un `include` manual en ningún archivo de esta guía. Composer ya sabe dónde buscar cada clase con solo mirar su namespace.

**Paso 1 — RED: escribe el test primero, sin que la clase exista.**

`tests/Sandbox/CalculatorTest.php`

```php
<?php

namespace App\Tests\Sandbox;

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

Fíjate que **no hay ningún `use App\Tests\Sandbox\Calculator;`** aquí, aunque `Calculator` todavía ni existe. No es un olvido: `CalculatorTest` y `Calculator` van a vivir en el mismo namespace (`App\Tests\Sandbox`), y PHP no te obliga a importar algo que ya está en tu propio namespace — el `use` solo hace falta para traer algo de **otro** namespace. Guarda esa regla, porque en la próxima lección vas a ver el caso contrario: el test vive en `App\Tests\...` y la clase real en `App\...`, namespaces distintos, y ahí el `use` sí es obligatorio.

Corre ese test ahora mismo, aunque `Calculator` no exista todavía:

```bash
php bin/phpunit tests/Sandbox/CalculatorTest.php
```

Vas a ver algo como esto:

```
There was 1 error:

1) App\Tests\Sandbox\CalculatorTest::testItAddsTwoNumbers
Error: Class "App\Tests\Sandbox\Calculator" not found

FAILURES!
Tests: 1, Assertions: 0, Errors: 1.
```

Eso es **RED**. No es un fracaso — es el punto de partida correcto. El test te está diciendo exactamente qué falta, con su namespace completo: `App\Tests\Sandbox\Calculator`.

**Paso 2 — GREEN: la implementación mínima para que pase.**

`tests/Sandbox/Calculator.php` — **mismo namespace que el test**, `App\Tests\Sandbox`, porque para Composer eso es lo único que importa para encontrarla:

```php
<?php

namespace App\Tests\Sandbox;

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
php bin/phpunit tests/Sandbox/CalculatorTest.php
```

```
OK (1 test, 1 assertion)
```

Eso es **GREEN**. No tuviste que tocar ningún archivo de configuración ni volver a correr `composer dump-autoload` — Composer ya sabía, por el namespace y el PSR-4 de arriba, que `Calculator.php` iba a aparecer en `tests/Sandbox/`. El test pasa con la implementación más simple posible — no adivinamos requisitos futuros, no agregamos `subtract()` ni `multiply()` porque "seguro los vamos a necesitar".

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

Antes de seguir a la próxima lección, agrega un segundo test a `CalculatorTest` para un método `subtract()` que todavía no existe, confirma que falla (RED), impleméntalo en `Calculator`, y confirma que pasa (GREEN). Cuando termines, borra el experimento completo — no se lleva nada del proyecto real con él:

```bash
rm -rf tests/Sandbox
```

A partir de la próxima lección vas a repetir exactamente este mismo ciclo, pieza por pieza, sobre el dominio real: `Email`, `UserId`, `User` y cada Handler. La diferencia es que ahí la clase de producción (`src/User/Domain/ValueObject/Email.php`, namespace `App\User\Domain\ValueObject`) y su test (`tests/Unit/User/Domain/ValueObject/EmailTest.php`, namespace `App\Tests\Unit\User\Domain\ValueObject`) **sí** viven en namespaces distintos — por eso cada test a partir de ahora empieza con un `use App\...` explícito importando la clase que prueba. Ya sabes exactamente por qué está esa línea.

Cada vez que veas un bloque de test en las siguientes lecciones, la instrucción implícita es la misma: **cópialo en la ruta indicada, corre `phpunit`, mira el error, y solo entonces sigue leyendo la implementación.**
