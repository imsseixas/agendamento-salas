# Agendamento de Salas — Santa Izabel

Sistema web para reserva de salas da instituição. Esta versão entrega a **fundação + autenticação + bookings** do MVP descrito em `contexto.md`.

## Stack

- **Next.js 15** (App Router, React 19)
- **TailwindCSS 4**
- **Prisma ORM** com **PostgreSQL** (dev e produção — recomendado [Neon](https://neon.tech))
- Auth com **JWT** em cookie httpOnly + **bcrypt**

## Estrutura

```
app/
  page.js                      # Redireciona para /login (sem acesso público à agenda)
  login/page.js                # Login (encaminha ADMIN→/admin, demais→/agendar)
  (painel)/                    # Grupo com layout de dashboard (painel lateral + topo)
    layout.js                  # Guarda de sessão + sidebar compartilhada
    agendar/page.js            # Segmento "Agendamentos" (criar/cancelar)
    admin/page.js              # Segmento "Telas públicas" (admin)
  display/[slug]/page.js       # Tela pública de exibição (sem login) — 1 link por tela
  api/
    auth/route.js              # POST login · GET sessão · DELETE logout
    rooms/route.js             # GET salas · POST criar (admin)
    bookings/route.js          # POST criar (com checagem de conflito) · GET (autenticado)
    bookings/[id]/route.js     # PATCH editar · DELETE cancelar
    screens/route.js           # GET listar · POST criar tela (admin)
    screens/[id]/route.js      # PATCH editar · DELETE excluir (admin)
    public/screens/[slug]/route.js  # GET dados da tela pública (sem auth)
components/               # DashboardShell (sidebar), PublicDisplay, BookingForm, StatusBadge, PainelContext
hooks/useAuth.js          # Estado de autenticação no cliente
lib/                      # prisma, auth, booking, slug, constants, format
prisma/
  schema.prisma           # Modelo de dados (User, Room, Booking, PublicScreen…)
  seed.js                 # Admin/coordenador/usuário + salas + recursos
  demo.js                 # (opcional) agendamentos de exemplo para hoje
```

## Telas públicas (exibição)

Não há mais agenda pública fixa nem "agendar sem login". As telas de exibição
são criadas pelo **ADMIN** em `/admin`:

1. Admin faz login → vai para `/admin`.
2. Cria uma tela informando um **nome** e selecionando **quais salas** aparecem
   (a ordem de seleção define a ordem das colunas).
3. O sistema gera um **link único** `/display/<slug>` para cada tela.
4. Esse link é aberto em qualquer monitor/corredor — exibição pura, sem login,
   no estilo "PROGRAMAÇÃO DIÁRIA", com atualização a cada 30s e virada automática
   à meia-noite.

## Como rodar (dev)

Precisa de um PostgreSQL. Crie um grátis no [Neon](https://neon.tech) e
preencha o `.env` com base no `.env.example` (`DATABASE_URL` + `DIRECT_URL`).

```bash
npm install
npm run db:deploy    # aplica as migrações no Postgres
npm run db:seed      # popula admin, salas e recursos
npm run dev          # http://localhost:3000
```

### Credenciais de desenvolvimento (seed)

| Papel       | E-mail                         | Senha     |
|-------------|--------------------------------|-----------|
| ADMIN       | admin@santaizabel.edu          | admin123  |
| COORDENADOR | coordenador@santaizabel.edu    | coord123  |
| USER        | usuario@santaizabel.edu        | user123   |

> Troque essas senhas antes de qualquer ambiente real.

## Regras de negócio implementadas

- **Conflito de horário**: detecção de sobreposição (`start < fim && fim > start`) na criação e edição, em transação. Primeiro a salvar vence; o segundo recebe `409` com sugestões de horários livres.
- **Janela de 3 meses**: agendamentos só até `MAX_BOOKING_MONTHS` à frente (configurável no `.env`).
- **Recorrência**: diária/semanal/mensal com intervalo e data final; a série é bloqueada se qualquer instância conflitar.
- **Aprovação**: salas com `requiresApproval` criam bookings em `PENDING` (confirmação por ADMIN/COORDENADOR).
- **Papéis**: USER, COORDENADOR, ADMIN.

## Deploy (Vercel + Neon)

Passo a passo completo em [DEPLOY.md](DEPLOY.md). Resumo: banco no **Neon**
(grátis), app na **Vercel** (grátis), variáveis `DATABASE_URL` / `DIRECT_URL` /
`JWT_SECRET`. O build aplica as migrações automaticamente (`prisma migrate deploy`).

## Próximos passos (fora do escopo desta entrega)

Tela pública em tempo real via WebSocket, notificações por e-mail (Mailtrap/SendGrid),
export `.ics` e QR code por sala, painel admin completo e relatórios. Ver `contexto.md`.
