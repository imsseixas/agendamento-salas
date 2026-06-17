// Seed inicial — cria admin, coordenador, usuário padrão, salas e recursos.
// Executado por `node prisma/seed.js` (CommonJS standalone).
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Senhas iniciais de DESENVOLVIMENTO — troque em produção.
const SEED_USERS = [
  { email: "admin@santaizabel.edu", name: "Administrador", role: "ADMIN", password: "admin123" },
  { email: "coordenador@santaizabel.edu", name: "Coordenador", role: "COORDENADOR", password: "coord123" },
  { email: "usuario@santaizabel.edu", name: "Usuário Padrão", role: "USER", password: "user123" },
];

const SEED_RESOURCES = ["Projetor", "Som", "Microfone", "TV", "Ar-condicionado", "Quadro branco"];

const SEED_ROOMS = [
  { name: "Auditório Principal", capacity: 120, description: "Espaço para eventos e palestras", requiresApproval: true, resources: ["Projetor", "Som", "Microfone", "Ar-condicionado"] },
  { name: "Sala de Aula 101", capacity: 40, description: "Sala de aula padrão", requiresApproval: false, resources: ["Projetor", "Quadro branco"] },
  { name: "Sala de Aula 102", capacity: 40, description: "Sala de aula padrão", requiresApproval: false, resources: ["TV", "Quadro branco"] },
  { name: "Laboratório de Anatomia", capacity: 30, description: "Laboratório especializado", requiresApproval: true, resources: ["Projetor", "TV", "Ar-condicionado"] },
  { name: "Sala de Reunião", capacity: 12, description: "Reuniões e pequenos grupos", requiresApproval: false, resources: ["TV", "Ar-condicionado"] },
];

async function main() {
  console.log("→ Semeando recursos...");
  const resourceMap = {};
  for (const name of SEED_RESOURCES) {
    const r = await prisma.resource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    resourceMap[name] = r.id;
  }

  console.log("→ Semeando usuários...");
  for (const u of SEED_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { email: u.email, name: u.name, role: u.role, password: hashed },
    });
    console.log(`   • ${u.role}: ${u.email} (senha: ${u.password})`);
  }

  console.log("→ Semeando salas...");
  for (const room of SEED_ROOMS) {
    const created = await prisma.room.upsert({
      where: { name: room.name },
      update: {
        capacity: room.capacity,
        description: room.description,
        requiresApproval: room.requiresApproval,
      },
      create: {
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        requiresApproval: room.requiresApproval,
      },
    });

    // Reseta e recria as relações de recursos da sala
    await prisma.roomResource.deleteMany({ where: { roomId: created.id } });
    for (const resName of room.resources) {
      await prisma.roomResource.create({
        data: { roomId: created.id, resourceId: resourceMap[resName] },
      });
    }
    console.log(`   • ${room.name} (${room.capacity} lugares)`);
  }

  console.log("\n✅ Seed concluído.");
  console.log("   Login admin:       admin@santaizabel.edu / admin123");
  console.log("   Login coordenador: coordenador@santaizabel.edu / coord123");
  console.log("   Login usuário:     usuario@santaizabel.edu / user123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
