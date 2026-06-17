import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-inseguro";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias (segundos)

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Define o cookie httpOnly da sessão.
export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Retorna o usuário autenticado (sem o hash da senha) ou null.
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user || !user.active) return null;
  return user;
}

// Helper para exigir autenticação em route handlers. Lança erro com status.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Não autenticado");
    err.status = 401;
    throw err;
  }
  return user;
}

// Exige um dos papéis informados.
export async function requireRole(roles) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    const err = new Error("Acesso negado");
    err.status = 403;
    throw err;
  }
  return user;
}

export { COOKIE_NAME };
