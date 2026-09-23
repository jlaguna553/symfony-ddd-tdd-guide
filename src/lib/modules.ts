export type ModuleId =
  | "fundamentos"
  | "arranque"
  | "dominio"
  | "aplicacion"
  | "infraestructura"
  | "concurrencia"
  | "avanzada"
  | "operacion"
  | "cierre";

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
}

export const MODULES: ModuleMeta[] = [
  {
    id: "fundamentos",
    title: "1. Fundamentos y arquitectura",
    description: "Qué vamos a construir, la dirección de dependencias y los principios que no se negocian.",
  },
  {
    id: "arranque",
    title: "2. Arranque del proyecto",
    description: "Symfony, MySQL y la disciplina de TDD antes de escribir una sola línea de dominio.",
  },
  {
    id: "dominio",
    title: "3. Capa de dominio",
    description: "Value Objects, la entidad User y el puerto de repositorio, sin Symfony ni Doctrine.",
  },
  {
    id: "aplicacion",
    title: "4. Capa de aplicación",
    description: "Commands, Queries, Handlers, DTOs y el repositorio en memoria para probarlos rápido.",
  },
  {
    id: "infraestructura",
    title: "5. Capa de infraestructura",
    description: "Todo lo que vive bajo Infrastructure/: el adaptador Doctrine y sus migraciones, los Controllers HTTP y el manejo de errores — y los Integration/Functional Tests que prueban que cada uno funciona contra sistemas reales.",
  },
  {
    id: "concurrencia",
    title: "6. Concurrencia y evolución",
    description: "Race conditions, transacciones, paginación, filtrado y ordenamiento.",
  },
  {
    id: "avanzada",
    title: "7. Arquitectura avanzada",
    description: "CQRS, Domain Events, Outbox y las preocupaciones transversales de un sistema real.",
  },
  {
    id: "operacion",
    title: "8. Operación y CI/CD",
    description: "Docker, pipelines, PHPStan, Deptrac y la pirámide de testing como referencia.",
  },
  {
    id: "cierre",
    title: "9. Cierre y dominio del tema",
    description: "Flujos completos, preguntas de entrevista y el resumen mental para el próximo módulo.",
  },
];

export function moduleById(id: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.id === id);
}
