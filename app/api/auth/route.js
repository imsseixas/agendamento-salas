import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { json, error, handleError } from "@/lib/http";

// POST /api/auth -> login { email, password }
export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return error("Informe e-mail e senha.", 400);
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user || !user.active) {
      return error("Credenciais inválidas.", 401);
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return error("Credenciais inválidas.", 401);
    }

    const token = signToken({ sub: user.id, role: user.role });
    await setSessionCookie(token);

    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    return handleError(e);
  }
}

// GET /api/auth -> usuário atual ou null
export async function GET() {
  try {
    const user = await getCurrentUser();
    return json({ user });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/auth -> logout
export async function DELETE() {
  try {
    await clearSessionCookie();
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
