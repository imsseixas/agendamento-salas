"use client";

import { createContext, useContext } from "react";

// Compartilha o usuário autenticado (carregado uma vez no layout do painel)
// com as páginas internas, evitando refetch de /api/auth em cada tela.
export const PainelContext = createContext(null);

export function usePainel() {
  return useContext(PainelContext);
}
