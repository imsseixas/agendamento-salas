import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES, BOOKING_STATUS } from "@/lib/constants";
import { validateInterval, findConflicts, suggestAlternatives } from "@/lib/booking";
import { json, error, handleError } from "@/lib/http";

// Só o dono do agendamento ou ADMIN/COORDENADOR podem alterá-lo.
function canManage(user, booking) {
  return booking.userId === user.id || user.role === ROLES.ADMIN || user.role === ROLES.COORDENADOR;
}

// PATCH /api/bookings/:id -> editar (dono ou admin)
export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return error("Agendamento não encontrado.", 404);
    if (!canManage(user, booking)) return error("Acesso negado.", 403);

    const body = await request.json();
    const { title, description, startAt, endAt, attendees, status } = body;

    const newStart = startAt ? new Date(startAt) : booking.startAt;
    const newEnd = endAt ? new Date(endAt) : booking.endAt;

    // Se mudou horário, revalida intervalo e conflito.
    if (startAt || endAt) {
      const intervalErrors = validateInterval(newStart, newEnd);
      if (intervalErrors.length) return error(intervalErrors.join(" "), 400);

      const conflicts = await findConflicts(
        booking.roomId,
        [{ startAt: newStart, endAt: newEnd }],
        { excludeBookingId: id }
      );
      if (conflicts.length > 0) {
        const suggestions = await suggestAlternatives(booking.roomId, newStart, newEnd, 3);
        return error("Conflito de horário com agendamento existente.", 409, {
          conflicts: conflicts.map((c) => ({
            id: c.conflict.id,
            title: c.conflict.title,
            startAt: c.conflict.startAt,
            endAt: c.conflict.endAt,
          })),
          suggestions,
        });
      }
    }

    // Mudança de status para CONFIRMED/aprovação só por ADMIN/COORDENADOR.
    let nextStatus = booking.status;
    if (status && status !== booking.status) {
      const isManager = user.role === ROLES.ADMIN || user.role === ROLES.COORDENADOR;
      if (!isManager && status === BOOKING_STATUS.CONFIRMED) {
        return error("Apenas gestores podem confirmar agendamentos pendentes.", 403);
      }
      nextStatus = status;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(startAt ? { startAt: newStart } : {}),
        ...(endAt ? { endAt: newEnd } : {}),
        ...(attendees !== undefined ? { attendees: Number(attendees) || 1 } : {}),
        status: nextStatus,
      },
    });

    return json({ booking: updated });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/bookings/:id -> cancelar (marca como CANCELLED)
export async function DELETE(request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return error("Agendamento não encontrado.", 404);
    if (!canManage(user, booking)) return error("Acesso negado.", 403);

    const cancelled = await prisma.booking.update({
      where: { id },
      data: { status: BOOKING_STATUS.CANCELLED },
    });

    return json({ booking: cancelled, message: "Agendamento cancelado." });
  } catch (e) {
    return handleError(e);
  }
}
