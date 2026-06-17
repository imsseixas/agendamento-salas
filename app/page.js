import { redirect } from "next/navigation";

// A raiz não expõe agenda pública nem agendamento sem login.
// As telas públicas vivem em /display/[slug] (links gerados pelo admin).
export default function Home() {
  redirect("/login");
}
