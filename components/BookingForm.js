"use client";

import { useState } from "react";
import { formatTime, toDateTimeLocal } from "@/lib/format";

// initial: { roomId, startAt(Date), endAt(Date) } para pré-preencher (ex.: clique no calendário)
export default function BookingForm({ rooms, onCreated, initial, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    roomId: initial?.roomId || rooms[0]?.id || "",
    startAt: initial?.startAt ? toDateTimeLocal(initial.startAt) : "",
    endAt: initial?.endAt ? toDateTimeLocal(initial.endAt) : "",
    attendees: 1,
    recurring: false,
    freq: "WEEKLY",
    interval: 1,
    until: "",
  });
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSuggestions([]);
    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description,
      roomId: form.roomId,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      attendees: Number(form.attendees),
      recurring: form.recurring,
      recurrence: form.recurring
        ? { freq: form.freq, interval: Number(form.interval), until: form.until }
        : undefined,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        setError(data.error);
        setSuggestions(data.suggestions || []);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Falha ao criar agendamento.");
        return;
      }

      setSuccess(data.message || "Agendamento criado.");
      setForm((f) => ({ ...f, title: "", description: "", startAt: "", endAt: "" }));
      onCreated?.();
    } catch {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-800">Novo agendamento</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Sala</label>
          <select
            value={form.roomId}
            onChange={(e) => update("roomId", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity}){r.requiresApproval ? " — requer aprovação" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Participantes</label>
          <input
            type="number"
            min={1}
            value={form.attendees}
            onChange={(e) => update("attendees", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Início</label>
          <input
            type="datetime-local"
            required
            value={form.startAt}
            onChange={(e) => update("startAt", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Término</label>
          <input
            type="datetime-local"
            required
            value={form.endAt}
            onChange={(e) => update("endAt", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg bg-brand-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => update("recurring", e.target.checked)}
          />
          Agendamento recorrente
        </label>

        {form.recurring && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600">Frequência</label>
              <select
                value={form.freq}
                onChange={(e) => update("freq", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-300 px-2 py-1.5 text-sm"
              >
                <option value="DAILY">Diária</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Intervalo</label>
              <input
                type="number"
                min={1}
                value={form.interval}
                onChange={(e) => update("interval", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Até</label>
              <input
                type="date"
                value={form.until}
                onChange={(e) => update("until", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800">Horários alternativos sugeridos:</p>
          <ul className="mt-1 space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    update("startAt", s.startAt.slice(0, 16));
                    update("endAt", s.endAt.slice(0, 16));
                  }}
                  className="text-brand-700 underline"
                >
                  {formatTime(s.startAt)} – {formatTime(s.endAt)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {success && <p className="text-sm text-brand-700">{success}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-brand-300 px-4 py-2 font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Agendar"}
        </button>
      </div>
    </form>
  );
}
