import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { json, error, handleError } from "@/lib/http";

// PATCH /api/screens/:id -> editar nome/salas/ativo (admin)
export async function PATCH(request, { params }) {
  try {
    await requireRole([ROLES.ADMIN]);
    const { id } = await params;
    const { name, roomIds, active } = await request.json();

    const screen = await prisma.publicScreen.findUnique({ where: { id } });
    if (!screen) return error("Tela não encontrada.", 404);

    // Atualiza salas (substitui o conjunto) quando roomIds vier.
    if (Array.isArray(roomIds)) {
      if (roomIds.length === 0) return error("Selecione ao menos uma sala.", 400);
      await prisma.publicScreenRoom.deleteMany({ where: { screenId: id } });
      await prisma.publicScreenRoom.createMany({
        data: roomIds.map((roomId, i) => ({ screenId: id, roomId, position: i })),
      });
    }

    const updated = await prisma.publicScreen.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    return json({ screen: updated });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/screens/:id -> excluir tela (admin)
export async function DELETE(request, { params }) {
  try {
    await requireRole([ROLES.ADMIN]);
    const { id } = await params;
    await prisma.publicScreen.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
