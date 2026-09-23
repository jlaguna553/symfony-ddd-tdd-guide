---
slug: "principios-fundamentales"
order: 3
module: "fundamentos"
title: "Principios fundamentales"
summary: "La regla que no se negocia: el dominio no sabe que Symfony, Doctrine o HTTP existen."
objectives:
  - "Identificar qué frameworks y tecnologías NO debe conocer el Domain."
  - "Reconocer la diferencia entre un método de dominio expresivo y un setter que rompe invariantes."
newFiles: []
---

El **Domain** no debe depender de:

- Symfony
- Doctrine
- MySQL
- HTTP
- Controllers
- Request
- Response

El dominio debe poder entenderse sin saber que Symfony existe.

Por ejemplo, esto es correcto:

```php
$user->update(
    $email,
    $name
);
```

Mientras que esto sería una señal de acoplamiento:

```php
$user->setEmail(...);
```

si esa modificación permite saltarse reglas de negocio.

La diferencia no es estética. Un método como `update()` puede validar invariantes antes de aplicar el cambio; un setter público invita a que cualquier capa externa manipule el estado sin pasar por esas reglas. Vas a ver esta idea aplicada de forma concreta en la [capa de dominio](/lecciones/capa-de-dominio).
