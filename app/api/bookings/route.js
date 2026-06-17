import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { BOOKING_STATUS, BLOCKING_STATUSES } from "@/lib/constants";
import {
  validateInterval,
  expandRecurrence,
  findConflicts,
  suggestAlternatives,
} from "@/lib/booking";
import { json, error, handleError } from "@/lib/http";

// GET /api/bookings?roomId=&date=YYYY-MM-DD&from=&to=
// Público (usado pela tela do corredor). Não exige autenticação.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let startRange;
    let endRange;

    if (date) {
      startRange = new Date(`${date}T00:00:00.000`);
      endRange = new Date(`${date}T23:59:59.999`);
    } else if (from && to) {
      startRange = new Date(from);
      endRange = new Date(to);
    }

    const where = {
      status: { in: BLOCKING_STATUSES },
      ...(roomId ? { roomId } : {}),
      ...(startRange && endRange
        ? { startAt: { lt: endRange }, endAt: { gt: startRange } }
        : {}),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startAt: "asc" },
      include: {
        room: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    return json({ bookings });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/bookings -> criar agendamento (autenticado)
export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { title, description, roomId, startAt, endAt, attendees, recurring, recurrence } = body;

    if (!title || !roomId || !startAt || !endAt) {
      return error("Campos obrigatórios: title, roomId, startAt, endAt.", 400);
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    const intervalErrors = validateInterval(start, end);
    if (intervalErrors.length) {
      return error(intervalErrors.join(" "), 400);
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.active) {
      return error("Sala não encontrada.", 404);
    }

    // Expande recorrência (ou evento único).
    const instances = recurring
      ? expandRecurrence(start, end, recurrence)
      : [{ startAt: start, endAt: end }];

    // Status inicial: PENDING se a sala exige aprovação, senão CONFIRMED.
    const status = room.requiresApproval ? BOOKING_STATUS.PENDING : BOOKING_STATUS.CONFIRMED;

    // Checagem atômica de conflito + criação dentro de uma transação.
    // (SQLite serializa escritas; em Postgres isto roda em transação real.)
    const result = await prisma.$transaction(async (tx) => {
      // Reusa a lógica de conflito mas dentro da transação para consistência.
      const minStart = instances.reduce((m, i) => (i.startAt < m ? i.startAt : m), instances[0].startAt);
      const maxEnd = instances.reduce((m, i) => (i.endAt > m ? i.endAt : m), instances[0].endAt);

      const existing = await tx.booking.findMany({
        where: {
          roomId,
          status: { in: BLOCKING_STATUSES },
          startAt: { lt: maxEnd },
          endAt: { gt: minStart },
        },
        select: { id: true, title: true, startAt: true, endAt: true },
      });

      const conflicts = [];
      for (const inst of instances) {
        for (const ex of existing) {
          if (inst.startAt < ex.endAt && inst.endAt > ex.startAt) {
            conflicts.push({ instance: inst, conflict: ex });
          }
        }
      }

      if (conflicts.length > 0) {
        return { conflicts };
      }

      const recurrenceId = recurring ? `rec_${user.id}_${Date.now()}` : null;

      const created = await Promise.all(
        instances.map((inst) =>
          tx.booking.create({
            data: {
              title: String(title).trim(),
              description: description || null,
              startAt: inst.startAt,
              endAt: inst.endAt,
              attendees: Number(attendees) || 1,
              recurring: Boolean(recurring),
              recurrenceId,
              status,
              userId: user.id,
              roomId,
            },
          })
        )
      );

      return { created };
    });

    // Conflito detectado -> 409 com sugestões.
    if (result.conflicts) {
      const suggestions = await suggestAlternatives(roomId, start, end, 3);
      return error("Conflito de horário com agendamento existente.", 409, {
        conflicts: result.conflicts.map((c) => ({
          id: c.conflict.id,
          title: c.conflict.title,
          startAt: c.conflict.startAt,
          endAt: c.conflict.endAt,
        })),
        suggestions,
      });
    }

    return json(
      {
        bookings: result.created,
        status,
        message:
          status === BOOKING_STATUS.PENDING
            ? "Agendamento criado e aguardando aprovação."
            : "Agendamento confirmado.",
      },
      201
    );
  } catch (e) {
    return handleError(e);
  }
}
