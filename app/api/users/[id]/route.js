import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { json, error, handleError } from "@/lib/http";

// PATCH /api/users/:id -> alterar papel / ativar / desativar (admin)
export async function PATCH(request, { params }) {
  try {
    const admin = await requireRole([ROLES.ADMIN]);
    const { id } = await params;
    const { role, active } = await request.json();

    if (id === admin.id && active === false) {
      return error("Você não pode desativar a própria conta.", 400);
    }

    const data = {};
    if (role !== undefined) {
      if (![ROLES.USER, ROLES.COORDENADOR, ROLES.ADMIN].includes(role)) {
        return error("Papel inválido.", 400);
      }
      data.role = role;
    }
    if (active !== undefined) data.active = Boolean(active);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return json({ user });
  } catch (e) {
    return handleError(e);
  }
}
