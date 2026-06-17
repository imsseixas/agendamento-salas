import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { baseSlug, randomSuffix } from "@/lib/slug";
import { json, error, handleError } from "@/lib/http";

// GET /api/screens -> lista de telas públicas (admin)
export async function GET() {
  try {
    await requireRole([ROLES.ADMIN]);
    const screens = await prisma.publicScreen.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rooms: { include: { room: { select: { id: true, name: true } } }, orderBy: { position: "asc" } },
      },
    });
    const data = screens.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      active: s.active,
      rooms: s.rooms.map((r) => ({ id: r.room.id, name: r.room.name })),
    }));
    return json({ screens: data });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/screens -> criar tela pública (admin) { name, roomIds: [] }
export async function POST(request) {
  try {
    await requireRole([ROLES.ADMIN]);
    const { name, roomIds } = await request.json();

    if (!name || !Array.isArray(roomIds) || roomIds.length === 0) {
      return error("Informe um nome e ao menos uma sala.", 400);
    }

    // Slug único: base do nome + sufixo aleatório.
    let slug = `${baseSlug(name)}-${randomSuffix()}`;
    while (await prisma.publicScreen.findUnique({ where: { slug } })) {
      slug = `${baseSlug(name)}-${randomSuffix()}`;
    }

    const screen = await prisma.publicScreen.create({
      data: {
        name: String(name).trim(),
        slug,
        rooms: {
          create: roomIds.map((roomId, i) => ({ roomId, position: i })),
        },
      },
      include: { rooms: { include: { room: true } } },
    });

    return json({ screen: { id: screen.id, name: screen.name, slug: screen.slug } }, 201);
  } catch (e) {
    return handleError(e);
  }
}
