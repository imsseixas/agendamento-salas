"use client";

import { useRef, useState, useEffect } from "react";
import {
  START_HOUR,
  END_HOUR,
  HOUR_PX,
  isSameDay,
  assignLanes,
  WEEKDAYS,
} from "@/lib/calendar";

const STATUS_COLOR = {
  CONFIRMED: "bg-brand-500 border-brand-600",
  PENDING: "bg-amber-400 border-amber-500",
  CANCELLED: "bg-gray-300 border-gray-400",
};

function hhmm(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// days: array de Date (1 = visão dia, 7 = visão semana)
export default function Calendar({ days, bookings, onSlotClick, onBookingClick }) {
  const totalHours = END_HOUR - START_HOUR;
  const bodyHeight = totalHours * HOUR_PX;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Clique em espaço vazio → cria agendamento naquele horário (snap 30 min).
  function handleColumnClick(e, day) {
    // ignora cliques sobre um bloco existente
    if (e.target.closest("[data-booking]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let minutes = START_HOUR * 60 + (y / HOUR_PX) * 60;
    minutes = Math.floor(minutes / 30) * 30; // snap 30 min
    const start = new Date(day);
    start.setHours(0, minutes, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    onSlotClick?.(start, end);
  }

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-200 bg-white">
      {/* Cabeçalho dos dias */}
      <div className="flex border-b border-brand-200" style={{ paddingRight: 0 }}>
        <div className="w-14 shrink-0 border-r border-brand-100" />
        {days.map((day) => {
          const today = isSameDay(day, now);
          return (
            <div key={day.toISOString()} className="flex-1 border-l border-brand-100 py-2 text-center">
              <div className="text-[11px] uppercase text-gray-400">{WEEKDAYS[(day.getDay() + 6) % 7]}</div>
              <div
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  today ? "bg-brand-600 text-white" : "text-gray-700"
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Corpo rolável */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
        <div className="flex" style={{ height: bodyHeight }}>
          {/* Eixo de horas */}
          <div className="w-14 shrink-0 border-r border-brand-100">
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute -top-2 right-1 text-[10px] tabular-nums text-gray-400">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {days.map((day) => {
            const dayBookings = assignLanes(
              bookings.filter((b) => isSameDay(new Date(b.startAt), day))
            );
            const showNow = isSameDay(day, now);
            const nowMin = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
            const nowTop = (nowMin / 60) * HOUR_PX;

            return (
              <div
                key={day.toISOString()}
                className="relative flex-1 cursor-pointer border-l border-brand-100"
                onClick={(e) => handleColumnClick(e, day)}
              >
                {/* Linhas das horas */}
                {hours.map((h) => (
                  <div key={h} className="border-b border-brand-50" style={{ height: HOUR_PX }} />
                ))}

                {/* Linha "agora" */}
                {showNow && nowMin >= 0 && nowMin <= totalHours * 60 && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                    <div className="relative border-t-2 border-red-500">
                      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Blocos de agendamento */}
                {dayBookings.map((b) => {
                  const s = new Date(b.startAt);
                  const e = new Date(b.endAt);
                  const startMin = Math.max(s.getHours() * 60 + s.getMinutes() - START_HOUR * 60, 0);
                  const endMin = Math.min(e.getHours() * 60 + e.getMinutes() - START_HOUR * 60, totalHours * 60);
                  const top = (startMin / 60) * HOUR_PX;
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 18);
                  const width = 100 / b._lanes;
                  return (
                    <button
                      key={b.id}
                      data-booking
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onBookingClick?.(b);
                      }}
                      className={`absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-white shadow-sm ${
                        STATUS_COLOR[b.status] || STATUS_COLOR.CONFIRMED
                      }`}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `calc(${b._lane * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        zIndex: 10,
                      }}
                      title={`${b.title} · ${hhmm(s)}–${hhmm(e)}`}
                    >
                      <div className="text-[11px] font-semibold leading-tight">
                        {hhmm(s)} {b.title}
                      </div>
                      {height > 34 && b.user?.name && (
                        <div className="truncate text-[10px] opacity-90">{b.user.name}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
