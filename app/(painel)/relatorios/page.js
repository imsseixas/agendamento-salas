"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePainel } from "@/components/PainelContext";
import { toDateInput } from "@/lib/format";

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return toDateInput(d);
}

export default function RelatoriosPage() {
  const router = useRouter();
  const { user } = usePainel();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(toDateInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const allowed = user.role === "ADMIN" || user.role === "COORDENADOR";

  useEffect(() => {
    if (!allowed) router.replace("/agendar");
  }, [allowed, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?from=${from}&to=${to}`, { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  function exportCsv() {
    if (!data) return;
    const rows = [["Sala", "Agendamentos", "Horas", "Participantes", "Equipamentos"]];
    data.rooms.forEach((r) => rows.push([r.name, r.count, r.hours, r.attendees, r.resources.join("; ")]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-salas-${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500">De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-brand-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-brand-300 px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Atualizar
        </button>
        <button onClick={exportCsv} className="rounded-lg border border-brand-300 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50">
          Exportar CSV (salas)
        </button>
      </div>

      {loading || !data ? (
        <p className="text-gray-500">Carregando relatórios…</p>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Card label="Agendamentos" value={data.summary.total} />
            <Card label="Confirmados" value={data.summary.confirmed} tone="brand" />
            <Card label="Pendentes" value={data.summary.pending} tone="amber" />
            <Card label="Cancelados" value={data.summary.cancelled} tone="gray" />
            <Card label="Participantes" value={data.summary.attendees} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Salas mais usadas">
              <BarList items={data.rooms.map((r) => ({ label: r.name, value: r.count, hint: `${r.hours}h` }))} unit="ag." />
            </Panel>

            <Panel title="Equipamentos mais solicitados">
              <BarList items={data.resources.map((r) => ({ label: r.name, value: r.count }))} unit="ag." />
              <p className="mt-2 text-xs text-gray-400">
                Contagem de agendamentos em salas que possuem cada equipamento.
              </p>
            </Panel>

            <Panel title="Ocupação por dia da semana">
              <BarList items={data.weekdays.map((w) => ({ label: w.day, value: w.count }))} unit="ag." />
            </Panel>

            <Panel title="Quem mais agenda">
              {data.users.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados no período.</p>
              ) : (
                <BarList items={data.users.map((u) => ({ label: u.name, value: u.count }))} unit="ag." />
              )}
            </Panel>
          </div>

          {/* Detalhe por sala (presenças/equipamentos) */}
          <Panel title="Detalhamento por sala">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200 text-left text-gray-500">
                    <th className="py-2 pr-3">Sala</th>
                    <th className="py-2 pr-3">Agend.</th>
                    <th className="py-2 pr-3">Horas</th>
                    <th className="py-2 pr-3">Participantes</th>
                    <th className="py-2">Equipamentos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rooms.map((r) => (
                    <tr key={r.name} className="border-b border-brand-50">
                      <td className="py-2 pr-3 font-medium text-brand-900">{r.name}</td>
                      <td className="py-2 pr-3">{r.count}</td>
                      <td className="py-2 pr-3">{r.hours}</td>
                      <td className="py-2 pr-3">{r.attendees}</td>
                      <td className="py-2 text-gray-600">{r.resources.join(", ") || "—"}</td>
                    </tr>
                  ))}
                  {data.rooms.length === 0 && (
                    <tr><td colSpan={5} className="py-3 text-gray-400">Sem agendamentos no período.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function Card({ label, value, tone }) {
  const tones = {
    brand: "text-brand-700",
    amber: "text-amber-600",
    gray: "text-gray-500",
  };
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${tones[tone] || "text-gray-800"}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-brand-800">{title}</h2>
      {children}
    </div>
  );
}

function BarList({ items, unit }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-gray-400">Sem dados no período.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, idx) => (
        <li key={idx}>
          <div className="mb-0.5 flex items-baseline justify-between text-sm">
            <span className="truncate pr-2 text-gray-700">{it.label}</span>
            <span className="shrink-0 tabular-nums text-gray-500">
              {it.value} {unit}
              {it.hint ? ` · ${it.hint}` : ""}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-brand-50">
            <div className="h-2.5 rounded-full bg-brand-500" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
