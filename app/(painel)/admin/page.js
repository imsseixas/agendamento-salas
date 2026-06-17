"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePainel } from "@/components/PainelContext";

export default function AdminScreensPage() {
  const router = useRouter();
  const { user } = usePainel();

  const [rooms, setRooms] = useState([]);
  const [screens, setScreens] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]); // ids na ordem de seleção
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Telas públicas são exclusivas de ADMIN.
  useEffect(() => {
    if (user.role !== "ADMIN") router.replace("/agendar");
  }, [user, router]);

  const loadAll = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetch("/api/rooms", { cache: "no-store" }),
      fetch("/api/screens", { cache: "no-store" }),
    ]);
    setRooms((await r.json()).rooms || []);
    setScreens((await s.json()).screens || []);
  }, []);

  useEffect(() => {
    if (user.role === "ADMIN") loadAll();
  }, [user, loadAll]);

  function toggleRoom(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || selected.length === 0) {
      setError("Informe um nome e selecione ao menos uma sala.");
      return;
    }
    const res = await fetch("/api/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, roomIds: selected }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao criar tela.");
      return;
    }
    setName("");
    setSelected([]);
    loadAll();
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta tela pública? O link deixará de funcionar.")) return;
    await fetch(`/api/screens/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function copyLink(slug) {
    const url = `${origin}/display/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  if (user.role !== "ADMIN") return null;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Criar tela */}
      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-800">Nova tela pública</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome da tela</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Corredor 2º andar"
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Salas exibidas <span className="text-gray-400">(a ordem de seleção define as colunas)</span>
          </label>
          <div className="max-h-56 space-y-1 overflow-auto rounded-lg border border-brand-200 p-2">
            {rooms.map((room) => {
              const pos = selected.indexOf(room.id);
              return (
                <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-brand-50">
                  <input type="checkbox" checked={pos !== -1} onChange={() => toggleRoom(room.id)} />
                  <span className="flex-1">{room.name}</span>
                  {pos !== -1 && (
                    <span className="rounded-full bg-brand-100 px-2 text-xs font-medium text-brand-700">{pos + 1}</span>
                  )}
                </label>
              );
            })}
            {rooms.length === 0 && <p className="text-sm text-gray-400">Nenhuma sala cadastrada.</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
          Criar tela e gerar link
        </button>
      </form>

      {/* Lista de telas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-800">Telas criadas</h2>
        {screens.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma tela ainda. Crie a primeira ao lado.</p>
        ) : (
          <ul className="space-y-3">
            {screens.map((s) => (
              <li key={s.id} className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-brand-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.rooms.map((r) => r.name).join(" · ") || "Sem salas"}</div>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                    {origin}/display/{s.slug}
                  </code>
                  <button onClick={() => copyLink(s.slug)} className="rounded border border-brand-300 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50">
                    {copied === s.slug ? "Copiado!" : "Copiar"}
                  </button>
                  <Link href={`/display/${s.slug}`} target="_blank" className="rounded bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700">
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
