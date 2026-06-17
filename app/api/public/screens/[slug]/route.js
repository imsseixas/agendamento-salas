import { prisma } from "@/lib/prisma";
import { BLOCKING_STATUSES } from "@/lib/constants";
import { json, error, handleError } from "@/lib/http";

// GET /api/public/screens/:slug?date=YYYY-MM-DD
// Endpoint PÚBLICO (sem autenticação) usado pelas telas de exibição.
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const screen = await prisma.publicScreen.findUnique({
      where: { slug },
      include: {
        rooms: {
          orderBy: { position: "asc" },
          include: { room: { select: { id: true, name: true } } },
        },
      },
    });

    if (!screen || !screen.active) {
      return error("Tela não encontrada.", 404);
    }

    const rooms = screen.rooms.map((r) => ({ id: r.room.id, name: r.room.name }));
    const roomIds = rooms.map((r) => r.id);

    let bookings = [];
    if (roomIds.length > 0) {
      const start = date ? new Date(`${date}T00:00:00.000`) : null;
      const end = date ? new Date(`${date}T23:59:59.999`) : null;
      bookings = await prisma.booking.findMany({
        where: {
          roomId: { in: roomIds },
          status: { in: BLOCKING_STATUSES },
          ...(start && end ? { startAt: { lt: end }, endAt: { gt: start } } : {}),
        },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          roomId: true,
          user: { select: { name: true } },
        },
      });
    }

    return json({ screen: { name: screen.name, slug: screen.slug }, rooms, bookings });
  } catch (e) {
    return handleError(e);
  }
}
