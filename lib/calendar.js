// Helpers de data (horário local) para a visão de calendário.

export const START_HOUR = 6;
export const END_HOUR = 22;
export const HOUR_PX = 48; // altura de 1 hora na grade

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Segunda-feira como início da semana.
export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // 0 = segunda
  return addDays(d, -day);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// Distribui blocos sobrepostos em "faixas" (lanes) para exibi-los lado a lado.
export function assignLanes(items) {
  const sorted = [...items].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const laneEnds = [];
  for (const it of sorted) {
    const s = new Date(it.startAt).getTime();
    const e = new Date(it.endAt).getTime();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    } else {
      laneEnds[lane] = e;
    }
    it._lane = lane;
  }
  const lanes = Math.max(1, laneEnds.length);
  for (const it of sorted) it._lanes = lanes;
  return sorted;
}

// Rótulo do período exibido.
export function periodLabel(days) {
  const fmt = (d, opts) => d.toLocaleDateString("pt-BR", opts);
  if (days.length === 1) {
    return fmt(days[0], { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }
  const a = days[0];
  const b = days[days.length - 1];
  const mesA = fmt(a, { month: "short" });
  const mesB = fmt(b, { month: "short" });
  if (mesA === mesB) {
    return `${a.getDate()} – ${b.getDate()} de ${fmt(b, { month: "long" })} de ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${mesA} – ${b.getDate()} ${mesB} ${b.getFullYear()}`;
}
