import { prisma } from "@/lib/prisma";
import {
  BLOCKING_STATUSES,
  RECURRENCE_FREQ,
  MAX_BOOKING_MONTHS,
} from "@/lib/constants";

// Dois intervalos se sobrepõem quando: start < other.end && end > other.start
export function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// Valida se o intervalo é coerente e está dentro da janela permitida.
export function validateInterval(startAt, endAt) {
  const errors = [];
  const now = new Date();

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    errors.push("Datas inválidas.");
    return errors;
  }
  if (endAt <= startAt) {
    errors.push("O término deve ser depois do início.");
  }
  if (startAt < now) {
    errors.push("Não é possível agendar no passado.");
  }

  const limit = new Date(now);
  limit.setMonth(limit.getMonth() + MAX_BOOKING_MONTHS);
  if (startAt > limit) {
    errors.push(`Só é permitido agendar até ${MAX_BOOKING_MONTHS} meses à frente.`);
  }
  return errors;
}

// Expande uma regra de recorrência em instâncias { startAt, endAt }.
// recurrence = { freq, interval, until }
export function expandRecurrence(startAt, endAt, recurrence) {
  if (!recurrence) return [{ startAt, endAt }];

  const { freq, interval = 1, until } = recurrence;
  const untilDate = until ? new Date(until) : null;
  const durationMs = endAt.getTime() - startAt.getTime();
  const step = Math.max(1, Number(interval) || 1);

  // Trava de segurança para evitar loops infinitos.
  const MAX_INSTANCES = 365;
  const instances = [];
  let cursor = new Date(startAt);

  for (let i = 0; i < MAX_INSTANCES; i++) {
    if (untilDate && cursor > untilDate) break;
    instances.push({
      startAt: new Date(cursor),
      endAt: new Date(cursor.getTime() + durationMs),
    });

    if (freq === RECURRENCE_FREQ.DAILY) {
      cursor.setDate(cursor.getDate() + step);
    } else if (freq === RECURRENCE_FREQ.WEEKLY) {
      cursor.setDate(cursor.getDate() + 7 * step);
    } else if (freq === RECURRENCE_FREQ.MONTHLY) {
      cursor.setMonth(cursor.getMonth() + step);
    } else {
      break; // freq desconhecida: trata como evento único
    }

    if (!untilDate) break; // sem data final, não geramos série
  }

  return instances;
}

// Busca conflitos para uma lista de instâncias em uma sala.
// Retorna array de { instance, conflict } para cada sobreposição encontrada.
export async function findConflicts(roomId, instances, { excludeBookingId } = {}) {
  if (instances.length === 0) return [];

  const minStart = instances.reduce((m, i) => (i.startAt < m ? i.startAt : m), instances[0].startAt);
  const maxEnd = instances.reduce((m, i) => (i.endAt > m ? i.endAt : m), instances[0].endAt);

  const existing = await prisma.booking.findMany({
    where: {
      roomId,
      status: { in: BLOCKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      // Pré-filtra pela janela total para reduzir o conjunto.
      startAt: { lt: maxEnd },
      endAt: { gt: minStart },
    },
    select: { id: true, title: true, startAt: true, endAt: true, status: true },
  });

  const conflicts = [];
  for (const inst of instances) {
    for (const ex of existing) {
      if (overlaps(inst.startAt, inst.endAt, ex.startAt, ex.endAt)) {
        conflicts.push({ instance: inst, conflict: ex });
      }
    }
  }
  return conflicts;
}

// Sugere os próximos N horários livres (em blocos da mesma duração) após um conflito.
export async function suggestAlternatives(roomId, startAt, endAt, count = 3) {
  const durationMs = endAt.getTime() - startAt.getTime();
  const suggestions = [];
  let cursor = new Date(endAt);
  let safety = 0;

  while (suggestions.length < count && safety < 48) {
    safety++;
    const s = new Date(cursor);
    const e = new Date(cursor.getTime() + durationMs);
    const conflicts = await findConflicts(roomId, [{ startAt: s, endAt: e }]);
    if (conflicts.length === 0) {
      suggestions.push({ startAt: s.toISOString(), endAt: e.toISOString() });
    }
    cursor = new Date(cursor.getTime() + durationMs);
  }
  return suggestions;
}
