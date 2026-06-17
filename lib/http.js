import { NextResponse } from "next/server";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// Converte erros lançados por requireUser/requireRole em respostas HTTP.
export function handleError(e) {
  if (e?.status) {
    return error(e.message, e.status);
  }
  console.error("Erro inesperado:", e);
  return error("Erro interno do servidor.", 500);
}
