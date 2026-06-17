"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePainel } from "@/components/PainelContext";
import Calendar from "@/components/Calendar";
import BookingForm from "@/components/BookingForm";
import StatusBadge from "@/components/StatusBadge";
import { formatTime, formatDateLong } from "@/lib/format";
import { startOfWeek, startOfDay, addDays, periodLabel } from "@/lib/calendar";

export default function AgendarPage() {
  const { user } = usePainel();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [view, setView] = useState("week"); // week | day
  const [refDate, setRefDate] = useState(() => new Date());
  const [bookings, setBookings] = useState([]);
  const [createInit, setCreateInit] = useState(null); // {roomId, startAt, endAt}
  const [detail, setDetail] = useState(null); // booking selecionado

  // Dias visíveis conforme a visão.
  const days = useMemo(() => {
    if (view === "day") return [startOfDay(refDate)];
    const start = startOfWeek(refDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, refDate]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/rooms", { cache: "no-store" });
      const data = (await r.json()).rooms || [];
      setRooms(data);
      setRoomId((prev) => prev || data[0]?.id || "");
    })();
  }, []);

  const loadBookings = useCallback(async () => {
    if (!roomId) return;
    const from = days[0];
    const to = addDays(days[days.length - 1], 1);
    const res = await fetch(
      `/api/bookings?roomId=${roomId}&from=${from.toISOString()}&to=${to.toISOString()}`,
      { cache: "no-store" }
    );
    setBookings((await res.json()).bookings || []);
  }, [roomId, days]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function move(dir) {
    const step = view === "day" ? 1 : 7;
    setRefDate((d) => addDays(d, dir * step));
  }

  function openCreate(startAt, endAt) {
    setCreateInit({ roomId, startAt, endAt });
  }

  async function cancelBooking(id) {
    if (!confirm("Cancelar este agendamento?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setDetail(null);
    loadBookings();
  }

  const canManage = (b) =>
    b.user?.id === user.id || user.role === "ADMIN" || user.role === "COORDENADOR";

  return (
    <div>
      {/* Barra de navegação */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="rounded-lg border border-brand-300 px-3 py-2 text-sm"
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div className="flex items-center overflow-hidden rounded-lg border border-brand-300">
          <button onClick={() => move(-1)} className="px-3 py-2 text-brand-700 hover:bg-brand-50" aria-label="Anterior">
            ‹
          </button>
          <button onClick={() => setRefDate(new Date())} className="border-x border-brand-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">
            Hoje
          </button>
          <button onClick={() => move(1)} className="px-3 py-2 text-brand-700 hover:bg-brand-50" aria-label="Próximo">
            ›
          </button>
        </div>

        <span className="text-sm font-medium text-gray-700 first-letter:uppercase">{periodLabel(days)}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-brand-300 text-sm">
            <button
              onClick={() => setView("week")}
              className={view === "week" ? "bg-brand-600 px-3 py-2 text-white" : "px-3 py-2 text-brand-700 hover:bg-brand-50"}
            >
              Semana
            </button>
            <button
              onClick={() => setView("day")}
              className={view === "day" ? "bg-brand-600 px-3 py-2 text-white" : "px-3 py-2 text-brand-700 hover:bg-brand-50"}
            >
              Dia
            </button>
          </div>
          <button
            onClick={() => {
              const s = new Date();
              s.setMinutes(0, 0, 0);
              s.setHours(s.getHours() + 1);
              openCreate(s, new Date(s.getTime() + 3600000));
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo
          </button>
        </div>
      </div>

      <Calendar days={days} bookings={bookings} onSlotClick={openCreate} onBookingClick={setDetail} />

      {/* Modal de criação */}
      {createInit && (
        <Modal onClose={() => setCreateInit(null)}>
          <BookingForm
            key={createInit.startAt?.toISOString()}
            rooms={rooms}
            initial={createInit}
            onCancel={() => setCreateInit(null)}
            onCreated={() => {
              setCreateInit(null);
              loadBookings();
            }}
          />
        </Modal>
      )}

      {/* Modal de detalhes */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="space-y-3 rounded-xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-brand-900">{detail.title}</h2>
              <StatusBadge status={detail.status} />
            </div>
            {detail.description && <p className="text-sm text-gray-600">{detail.description}</p>}
            <dl className="space-y-1 text-sm text-gray-700">
              <div><span className="text-gray-400">Sala:</span> {detail.room?.name}</div>
              <div className="capitalize"><span className="text-gray-400">Quando:</span> {formatDateLong(detail.startAt)}</div>
              <div><span className="text-gray-400">Horário:</span> {formatTime(detail.startAt)} – {formatTime(detail.endAt)}</div>
              {detail.user?.name && <div><span className="text-gray-400">Responsável:</span> {detail.user.name}</div>}
              <div><span className="text-gray-400">Participantes:</span> {detail.attendees}</div>
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDetail(null)} className="rounded-lg border border-brand-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Fechar
              </button>
              {detail.status !== "CANCELLED" && canManage(detail) && (
                <button onClick={() => cancelBooking(detail.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                  Cancelar agendamento
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto">{children}</div>
    </div>
  );
}
