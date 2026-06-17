"use client";

import React, { useEffect, useState, useRef } from "react";

// Cores por coluna (sala), no estilo do painel de referência.
const CORES = [
  "bg-blue-400",
  "bg-pink-400",
  "bg-green-400",
  "bg-gray-400",
  "bg-cyan-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-rose-400",
];

const formatDate = (date) => {
  const dia = date.getDate().toString().padStart(2, "0");
  const mes = date.toLocaleDateString("pt-BR", { month: "long" });
  const ano = date.getFullYear();
  const semana = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${dia} de ${mes} de ${ano} (${semana})`;
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
};

const hhmm = (d) =>
  `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

// rooms: [{id, name}]  bookings: [{id, roomId, title, startAt, endAt, status, user:{name}}]
export default function PublicDisplay({ screenName, rooms, bookings }) {
  const [currentDate, setCurrentDate] = useState("");
  const [now, setNow] = useState(new Date());
  const [agoraTop, setAgoraTop] = useState(null);
  const gridRef = useRef(null);
  const isSmallResolution = useMediaQuery("(max-width: 1379px)");
  const interval = isSmallResolution ? 60 : 30;
  const slotHeight = 24;

  // Constrói os agendamentos por sala com cor da coluna.
  const corPorSala = {};
  rooms.forEach((r, i) => (corPorSala[r.id] = CORES[i % CORES.length]));
  const agendamentos = bookings.map((b) => {
    const ini = new Date(b.startAt);
    const fim = new Date(b.endAt);
    return {
      roomId: b.roomId,
      inicio: hhmm(ini),
      fim: hhmm(fim),
      nome: b.title,
      responsavel: b.user?.name || "",
      cor: corPorSala[b.roomId] || "bg-blue-400",
      pending: b.status === "PENDING",
    };
  });

  const horarios = [];
  for (let h = 6; h <= 23; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    if (interval === 30 && h < 23) horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Posição da linha "Agora" medida no DOM (considera gaps/borders).
  useEffect(() => {
    if (!gridRef.current) return setAgoraTop(null);
    const minutosDesdeInicio = now.getHours() * 60 + now.getMinutes() - 360;
    if (minutosDesdeInicio < 0 || minutosDesdeInicio > 17 * 60) return setAgoraTop(null);

    const slotIndex = Math.floor(minutosDesdeInicio / interval);
    const slotTime = horarios[slotIndex];
    const slotEl = gridRef.current.querySelector(`[data-time="${slotTime}"]`);
    if (!slotEl) return setAgoraTop(null);

    const gridRect = gridRef.current.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    const offsetInsideSlot = ((minutosDesdeInicio % interval) / interval) * slotHeight;
    setAgoraTop(slotRect.top - gridRect.top + offsetInsideSlot);
    // horarios é derivado de interval; não precisa entrar nas deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, interval, slotHeight]);

  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-auto bg-gray-50 text-gray-800">
      <header className="flex flex-shrink-0 flex-col items-center gap-1 border-b border-green-200 bg-white px-4 py-2 shadow-sm sm:flex-row sm:gap-0 md:px-6 md:py-3 lg:px-8 lg:py-4">
        <div className="flex items-center">
          <img src="/logo-santa-casa.svg" alt="Logo" className="h-12 w-auto sm:mr-4 sm:h-16" />
        </div>
        <div className="flex flex-col items-center justify-center sm:flex-1">
          <h1 className="text-center text-xl font-bold md:text-2xl lg:text-3xl" style={{ color: "#73A94F" }}>
            PROGRAMAÇÃO DIÁRIA
          </h1>
          {screenName && <span className="text-xs text-gray-400 md:text-sm">{screenName}</span>}
        </div>
        <div>
          <p className="text-base font-medium sm:text-lg md:text-2xl lg:text-2xl" style={{ color: "#73A94F" }}>
            {currentDate}
          </p>
        </div>
      </header>

      <div className="flex-grow overflow-auto p-2 md:p-4">
        <div className="w-full" style={{ maxWidth: "100vw" }}>
          {/* Cabeçalho das salas */}
          <div
            className="grid gap-0.5 overflow-visible rounded border border-gray-300"
            style={{ gridTemplateColumns: `60px repeat(${rooms.length}, 1fr)`, position: "relative" }}
          >
            <div className="sticky left-0 top-0 z-20 border-r border-gray-300 bg-gray-100 px-1 py-1 text-center text-xs font-semibold md:text-sm lg:text-base">
              Horário
            </div>
            {rooms.map((sala) => (
              <div
                key={sala.id}
                className="sticky top-0 z-10 border-l border-gray-300 bg-green-100 px-1 py-1 text-center text-[10px] font-semibold md:text-xs lg:text-sm"
                title={sala.name}
              >
                {sala.name}
              </div>
            ))}
          </div>

          {/* Grade de horários + linha do agora */}
          <div
            className="grid gap-0.5 overflow-visible rounded-b border-x border-b border-gray-300"
            ref={gridRef}
            style={{
              gridTemplateColumns: `60px repeat(${rooms.length}, 1fr)`,
              position: "relative",
              height: `${horarios.length * slotHeight}px`,
            }}
          >
            {agoraTop !== null && (
              <div style={{ position: "absolute", top: `${agoraTop}px`, left: 0, width: "100%", height: "2px", background: "green", zIndex: 50 }}>
                <span style={{ position: "absolute", left: 0, top: "-14px", background: "green", color: "white", fontSize: "10px", padding: "0 4px", borderRadius: "2px" }}>
                  Agora: {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}

            {horarios.map((horario, index) => (
              <React.Fragment key={`linha-${index}`}>
                <div
                  className={`sticky left-0 flex items-center justify-end border-r border-gray-300 px-1 py-0.5 pr-1 text-right text-[8px] md:text-xs ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  }`}
                  data-time={horario}
                  style={{ height: `${slotHeight}px` }}
                >
                  {horario}
                </div>

                {rooms.map((sala) => {
                  const [slotH, slotM] = horario.split(":").map(Number);
                  const slotStart = slotH * 60 + slotM;
                  const slotEnd = slotStart + interval;
                  const blocos = agendamentos.filter((ag) => {
                    if (ag.roomId !== sala.id) return false;
                    const [agH, agM] = ag.inicio.split(":").map(Number);
                    const agStart = agH * 60 + agM;
                    return agStart >= slotStart && agStart < slotEnd;
                  });

                  return (
                    <div
                      key={`${index}-${sala.id}`}
                      className={`relative rounded border-l border-t border-gray-200 p-0.5 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                      style={{ height: `${slotHeight}px` }}
                    >
                      {blocos.map((ag, idx) => {
                        const [startH, startM] = ag.inicio.split(":").map(Number);
                        const [endH, endM] = ag.fim.split(":").map(Number);
                        const duracaoMin = endH * 60 + endM - (startH * 60 + startM);
                        const slotsSpanned = duracaoMin / interval;
                        const internalBorders = Math.max(0, Math.floor(slotsSpanned) - 1);
                        const altura = Math.round(slotsSpanned * slotHeight + internalBorders * 1);

                        return (
                          <div
                            key={idx}
                            className={`absolute left-0 flex w-full flex-col justify-between rounded px-1 py-1 text-white shadow ${ag.cor}`}
                            style={{ top: 0, height: `${altura}px`, zIndex: 10, opacity: ag.pending ? 0.8 : 1 }}
                            title={`${ag.nome} · ${ag.inicio}–${ag.fim}`}
                          >
                            <div className="truncate text-sm font-semibold leading-tight">
                              {ag.nome}
                              {ag.pending && " ⏳"}
                            </div>
                            <div className="text-right text-[10px] italic text-white/90">
                              {ag.responsavel || "Instrutor não informado"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
