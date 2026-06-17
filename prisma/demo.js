// Insere agendamentos de DEMONSTRAÇÃO para o dia de hoje, para visualizar
// a tela pública preenchida. Idempotente: remove os demos anteriores de hoje.
// Uso: node prisma/demo.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function at(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const user = await prisma.user.findFirst({ where: { role: "USER" } });
  if (!rooms.length || !user) throw new Error("Rode o seed antes (npm run db:seed).");

  // Limpa agendamentos de hoje para reinserir os demos.
  const start = at(0, 0);
  const end = at(23, 59);
  await prisma.booking.deleteMany({ where: { startAt: { gte: start, lte: end } } });

  const samples = [
    { room: 0, title: "SERVIÇO DE CIRURGIA GERAL", s: [7, 0], e: [8, 0] },
    { room: 0, title: "TREINAMENTO EM ESPIROMETRIA", s: [8, 30], e: [9, 30] },
    { room: 0, title: "DISCUSSÃO DE CASOS", s: [10, 0], e: [11, 30] },
    { room: 0, title: "SESSÃO DE ARRITMIA", s: [13, 30], e: [16, 30] },
    { room: 1, title: "Entrevista colaborador / Wildson Meireles", s: [6, 30], e: [8, 0] },
    { room: 1, title: "Entrevista colaborador / Wildson Meireles", s: [8, 30], e: [9, 30] },
    { room: 2, title: "SERVIÇO DE ORTOPEDIA", s: [6, 30], e: [8, 0] },
    { room: 2, title: "SESSÃO DE CLÍNICA MÉDICA / INTERNOS", s: [8, 30], e: [10, 0] },
    { room: 2, title: "SESSÃO MEDICINA INTENSIVA", s: [14, 0], e: [15, 30] },
    { room: 3, title: "SERVIÇO DE ANESTESIOLOGIA", s: [6, 30], e: [7, 30] },
    { room: 3, title: "Apresentação Faturamento", s: [8, 30], e: [10, 0] },
    { room: 3, title: "Reunião de equipe", s: [14, 0], e: [16, 30] },
    { room: 4 % 5, title: "SERVIÇO DE CIRURGIA GERAL", s: [6, 30], e: [9, 30] },
    { room: 0, title: "AULA FACULDADE SANTA CASA", s: [18, 0], e: [21, 30] },
    { room: 1, title: "AULA FACULDADE SANTA CASA", s: [18, 0], e: [21, 30] },
    { room: 2, title: "AULA FACULDADE SANTA CASA", s: [18, 0], e: [21, 30] },
    { room: 3, title: "AULA FACULDADE SANTA CASA", s: [18, 0], e: [21, 30] },
  ];

  for (const sp of samples) {
    const room = rooms[sp.room % rooms.length];
    await prisma.booking.create({
      data: {
        title: sp.title,
        startAt: at(sp.s[0], sp.s[1]),
        endAt: at(sp.e[0], sp.e[1]),
        attendees: 20,
        status: "CONFIRMED",
        userId: user.id,
        roomId: room.id,
      },
    });
  }

  console.log(`✅ ${samples.length} agendamentos de demonstração criados para hoje.`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
