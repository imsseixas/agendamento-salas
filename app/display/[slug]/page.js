"use client";

import { useState, useEffect, useCallback, use } from "react";
import PublicDisplay from "@/components/PublicDisplay";
import { toDateInput } from "@/lib/format";

export default function DisplayPage({ params }) {
  const { slug } = use(params);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound
  const [day, setDay] = useState(() => toDateInput(new Date()));

  const load = useCallback(
    async (date) => {
      try {
        const res = await fetch(`/api/public/screens/${slug}?date=${date}`, { cache: "no-store" });
        if (res.status === 404) {
          setStatus("notfound");
          return;
        }
        const json = await res.json();
        setData(json);
        setStatus("ok");
      } catch (e) {
        console.error(e);
      }
    },
    [slug]
  );

  // Polling (atualização "tempo real" leve) a cada 30s.
  useEffect(() => {
    load(day);
    const poll = setInterval(() => load(day), 30000);
    return () => clearInterval(poll);
  }, [day, load]);

  // Rollover automático à meia-noite.
  useEffect(() => {
    const id = setInterval(() => {
      const t = toDateInput(new Date());
      setDay((prev) => (prev !== t ? t : prev));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (status === "loading") {
    return <main className="grid min-h-screen place-items-center text-gray-500">Carregando…</main>;
  }
  if (status === "notfound") {
    return (
      <main className="grid min-h-screen place-items-center px-4 text-center text-gray-600">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">Tela não encontrada</h1>
          <p className="mt-2 text-sm">O link pode ter sido removido ou desativado.</p>
        </div>
      </main>
    );
  }

  return (
    <PublicDisplay
      screenName={data.screen?.name}
      rooms={data.rooms || []}
      bookings={data.bookings || []}
    />
  );
}
