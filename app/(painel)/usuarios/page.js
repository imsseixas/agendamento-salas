"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePainel } from "@/components/PainelContext";

export default function UsuariosPage() {
  const router = useRouter();
  const { user } = usePainel();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (user.role !== "ADMIN") router.replace("/agendar");
  }, [user, router]);

  const load = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    setUsers((await res.json()).users || []);
  }, []);

  useEffect(() => {
    if (user.role === "ADMIN") load();
  }, [user, load]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setOk("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao criar usuário.");
      return;
    }
    setOk(`Usuário ${data.user.name} criado.`);
    setForm({ name: "", email: "", password: "", role: "USER" });
    load();
  }

  async function patch(id, body) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  if (user.role !== "ADMIN") return null;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Criar usuário */}
      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-800">Novo usuário</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="mín. 6 caracteres"
              className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Papel</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
            >
              <option value="USER">Usuário</option>
              <option value="COORDENADOR">Coordenador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-brand-700">{ok}</p>}

        <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
          Criar usuário
        </button>
      </form>

      {/* Lista de usuários */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-800">Usuários ({users.length})</h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="rounded-lg border border-brand-200 bg-white p-3 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-brand-900">
                    {u.name} {!u.active && <span className="text-xs text-gray-400">(inativo)</span>}
                  </div>
                  <div className="truncate text-xs text-gray-500">{u.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className="rounded border border-brand-200 px-1.5 py-1 text-xs"
                    title="Papel"
                  >
                    <option value="USER">Usuário</option>
                    <option value="COORDENADOR">Coordenador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  <button
                    onClick={() => patch(u.id, { active: !u.active })}
                    className={`rounded px-2 py-1 text-xs ${
                      u.active ? "text-red-600 hover:underline" : "text-brand-700 hover:underline"
                    }`}
                  >
                    {u.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
