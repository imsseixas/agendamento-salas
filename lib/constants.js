// Valores controlados na aplicação (SQLite não tem enums nativos).
// Em produção com Postgres estes podem virar enums do Prisma.

export const ROLES = {
  USER: "USER",
  COORDENADOR: "COORDENADOR",
  ADMIN: "ADMIN",
};

export const BOOKING_STATUS = {
  CONFIRMED: "CONFIRMED",
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
};

// Frequências de recorrência suportadas
export const RECURRENCE_FREQ = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
};

// Status que ocupam a sala (consideram-se em checagem de conflito)
export const BLOCKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];

export const MAX_BOOKING_MONTHS = Number(process.env.MAX_BOOKING_MONTHS || 3);
