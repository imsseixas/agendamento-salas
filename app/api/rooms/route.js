import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { json, error, handleError } from "@/lib/http";

// GET /api/rooms -> lista de salas com recursos
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        resources: { include: { resource: true } },
      },
    });

    const data = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      description: r.description,
      requiresApproval: r.requiresApproval,
      resources: r.resources.map((rr) => rr.resource.name),
    }));

    return json({ rooms: data });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/rooms -> criar sala (apenas ADMIN)
export async function POST(request) {
  try {
    await requireRole([ROLES.ADMIN]);
    const body = await request.json();
    const { name, capacity, description, requiresApproval, resources = [] } = body;

    if (!name) return error("Nome da sala é obrigatório.", 400);

    const room = await prisma.room.create({
      data: {
        name: String(name).trim(),
        capacity: Number(capacity) || 0,
        description: description || null,
        requiresApproval: Boolean(requiresApproval),
      },
    });

    // Associa recursos (por nome), criando-os se necessário.
    for (const resName of resources) {
      const resource = await prisma.resource.upsert({
        where: { name: resName },
        update: {},
        create: { name: resName },
      });
      await prisma.roomResource.create({
        data: { roomId: room.id, resourceId: resource.id },
      });
    }

    return json({ room }, 201);
  } catch (e) {
    return handleError(e);
  }
}
