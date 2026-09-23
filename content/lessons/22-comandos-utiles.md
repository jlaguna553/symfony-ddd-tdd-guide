---
slug: "comandos-utiles"
order: 22
module: "operacion"
title: "Comandos útiles"
summary: "Referencia rápida de todos los comandos de phpunit y Doctrine que vas a usar día a día en este proyecto."
objectives:
  - "Tener a mano los comandos exactos para correr cada tipo de test por separado."
  - "Recordar los comandos de mapping, schema y migraciones de Doctrine."
newFiles: []
---

```bash
# Ejecutar todos
php bin/phpunit

# Unit
php bin/phpunit tests/Unit

# Application
php bin/phpunit tests/Application

# Integration
APP_ENV=test php bin/phpunit tests/Integration

# Functional
APP_ENV=test php bin/phpunit tests/Functional

# Mapping
php bin/console doctrine:mapping:info

# Schema
php bin/console doctrine:schema:validate

# Migration
php bin/console doctrine:migrations:diff
php bin/console doctrine:migrations:migrate
```

Guarda esta lección como referencia — vas a volver a ella constantemente mientras trabajas en el proyecto.
