import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, BOOKING_STATUS } from "@/lib/constants";
import { json, handleError } from "@/lib/http";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// GET /api/reports?from=&to=  (admin/coordenador)
export async function GET(request) {
  try {
    await requireRole([ROLES.ADMIN, ROLES.COORDENADOR]);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(`${from}T00:00:00.000`);
    if (to) dateFilter.lte = new Date(`${to}T23:59:59.999`);

    const bookings = await prisma.booking.findMany({
      where: Object.keys(dateFilter).length ? { startAt: dateFilter } : {},
      include: {
        room: { include: { resources: { include: { resource: true } } } },
        user: { select: { id: true, name: true } },
      },
    });

    const active = bookings.filter((b) => b.status !== BOOKING_STATUS.CANCELLED);

    // Resumo
    const summary = {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
      pending: bookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
      cancelled: bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length,
      attendees: active.reduce((s, b) => s + (b.attendees || 0), 0),
    };

    const hours = (b) => (new Date(b.endAt) - new Date(b.startAt)) / 3600000;

    // Salas mais usadas
    const roomMap = {};
    for (const b of active) {
      const r = (roomMap[b.roomId] ||= {
        name: b.room?.name || "—",
        count: 0,
        hours: 0,
        attendees: 0,
        resources: b.room?.resources.map((x) => x.resource.name) || [],
      });
      r.count++;
      r.hours += hours(b);
      r.attendees += b.attendees || 0;
    }
    const rooms = Object.values(roomMap)
      .map((r) => ({ ...r, hours: Math.round(r.hours * 10) / 10 }))
      .sort((a, b) => b.count - a.count);

    // Equipamentos mais solicitados (ponderado pelos agendamentos das salas que os têm)
    const resMap = {};
    for (const b of active) {
      for (const rr of b.room?.resources || []) {
        const name = rr.resource.name;
        resMap[name] = (resMap[name] || 0) + 1;
      }
    }
    const resources = Object.entries(resMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Ocupação por dia da semana
    const wdMap = Array(7).fill(0);
    for (const b of active) wdMap[new Date(b.startAt).getDay()]++;
    const weekdays = wdMap.map((count, i) => ({ day: WEEKDAYS[i], count }));

    // Top usuários (quem mais agenda)
    const userMap = {};
    for (const b of active) {
      if (!b.user) continue;
      const u = (userMap[b.user.id] ||= { name: b.user.name, count: 0 });
      u.count++;
    }
    const users = Object.values(userMap).sort((a, b) => b.count - a.count).slice(0, 10);

    return json({ summary, rooms, resources, weekdays, users });
  } catch (e) {
    return handleError(e);
  }
}
