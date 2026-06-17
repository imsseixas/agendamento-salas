import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { json, error, handleError } from "@/lib/http";

// GET /api/users -> lista de usuários (admin)
export async function GET() {
  try {
    await requireRole([ROLES.ADMIN]);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return json({ users });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/users -> criar usuário (admin) { name, email, password, role }
export async function POST(request) {
  try {
    await requireRole([ROLES.ADMIN]);
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return error("Nome, e-mail e senha são obrigatórios.", 400);
    }
    if (password.length < 6) {
      return error("A senha deve ter ao menos 6 caracteres.", 400);
    }
    const validRole = [ROLES.USER, ROLES.COORDENADOR, ROLES.ADMIN].includes(role) ? role : ROLES.USER;
    const normalizedEmail = String(email).toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return error("Já existe um usuário com esse e-mail.", 409);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: await hashPassword(password),
        role: validRole,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return json({ user }, 201);
  } catch (e) {
    return handleError(e);
  }
}
