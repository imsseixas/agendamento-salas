import { randomBytes } from "crypto";

// Gera um slug a partir do nome + sufixo aleatório, garantindo unicidade.
export function baseSlug(name) {
  return (
    String(name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // remove acentos
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tela"
  );
}

export function randomSuffix(len = 6) {
  return randomBytes(len).toString("hex").slice(0, len);
}
