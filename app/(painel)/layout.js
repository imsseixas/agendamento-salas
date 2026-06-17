"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PainelContext } from "@/components/PainelContext";
import DashboardShell from "@/components/DashboardShell";

// Layout compartilhado das telas internas (dashboard com painel lateral).
// Faz a guarda de sessão uma única vez e disponibiliza o usuário via contexto.
export default function PainelLayout({ children }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace("/login");
  }, [auth.loading, auth.user, router]);

  if (auth.loading || !auth.user) {
    return <div className="grid min-h-screen place-items-center text-gray-500">Carregando…</div>;
  }

  return (
    <PainelContext.Provider value={auth}>
      <DashboardShell user={auth.user} onLogout={auth.logout}>
        {children}
      </DashboardShell>
    </PainelContext.Provider>
  );
}
