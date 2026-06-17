"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLES } from "@/lib/constants";

// Ícones (SVG inline) — leves, sem dependência.
const Icon = {
  calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  ),
  monitor: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-4.9" />
    </svg>
  ),
  chart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 4v16h16" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="12" y="7" width="3" height="10" />
      <rect x="17" y="13" width="3" height="4" />
    </svg>
  ),
  logout: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h12" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

// Segmentos do dashboard. Cada um vira um item do painel lateral.
const NAV = [
  { href: "/agendar", label: "Agendamentos", icon: "calendar", roles: [ROLES.USER, ROLES.COORDENADOR, ROLES.ADMIN] },
  { href: "/relatorios", label: "Relatórios", icon: "chart", roles: [ROLES.COORDENADOR, ROLES.ADMIN] },
  { href: "/usuarios", label: "Usuários", icon: "users", roles: [ROLES.ADMIN] },
  { href: "/admin", label: "Telas públicas", icon: "monitor", roles: [ROLES.ADMIN] },
];

export default function DashboardShell({ user, onLogout, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false); // drawer no mobile

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const active = items.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  async function handleLogout() {
    await onLogout();
    router.replace("/login");
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className="flex items-center gap-2 border-b border-brand-700/40 px-4 py-4">
        <img src="/logo-santa-casa.svg" alt="" className="h-9 w-9 rounded bg-white/90 p-1" />
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Santa Izabel</div>
          <div className="text-[11px] text-brand-100">Agendamento de Salas</div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive = active?.href === item.href;
          const IconCmp = Icon[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <IconCmp className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuário + sair */}
      <div className="border-t border-brand-700/40 px-3 py-3">
        <div className="px-2 pb-2">
          <div className="truncate text-sm font-medium text-white">{user.name}</div>
          <div className="text-[11px] text-brand-100">{user.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-100 hover:bg-white/10 hover:text-white"
        >
          <Icon.logout className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-50/40">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-brand-800 md:block">
        {SidebarContent}
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-800 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 rounded p-1 text-white/80 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <Icon.close className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="md:pl-60">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-brand-700 hover:bg-brand-50 md:hidden"
            aria-label="Abrir menu"
          >
            <Icon.menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-brand-800">{active?.label || "Painel"}</h1>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
