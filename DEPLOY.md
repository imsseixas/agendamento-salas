# Deploy — Vercel + Neon (Postgres)

Guia para publicar o sistema gratuitamente, com banco persistente.
Stack: **Vercel** (hospedagem do Next.js) + **Neon** (PostgreSQL free tier).

> SQLite não funciona em hospedagem serverless (disco efêmero). Por isso o
> projeto usa **PostgreSQL** em dev e produção.

---

## 1. Criar o banco no Neon

1. Crie conta em https://neon.tech (pode entrar com o GitHub).
2. **Create project** → escolha uma região próxima (ex.: AWS / São Paulo `sa-east-1`).
3. Em **Connection Details**, copie **duas** strings:
   - **Pooled connection** (o host tem `-pooler`) → vai em `DATABASE_URL`.
   - **Direct connection** (sem `-pooler`) → vai em `DIRECT_URL`.
   - Mantenha o `?sslmode=require` no final.

## 2. Aplicar o schema e popular o banco (uma vez)

No seu computador, com o `.env` preenchido (veja `.env.example`):

```bash
npm install
npm run db:deploy     # aplica as migrações (prisma migrate deploy)
npm run db:seed       # cria admin/coordenador/usuário + salas + recursos
```

> Dica: dá para usar o **mesmo** banco para dev e produção no início, ou criar
> um **branch** no Neon (ex.: `development`) para isolar os dados de teste.

## 3. Publicar na Vercel

1. Crie conta em https://vercel.com e conecte sua conta do GitHub.
2. **Add New… → Project** → importe o repositório `imsseixas/agendamento-salas`.
3. Framework: **Next.js** (detectado automaticamente). Não mude o build.
4. Em **Environment Variables**, adicione:

   | Nome              | Valor                                             |
   |-------------------|---------------------------------------------------|
   | `DATABASE_URL`    | string **pooled** do Neon                         |
   | `DIRECT_URL`      | string **direct** do Neon                         |
   | `JWT_SECRET`      | um segredo forte e aleatório                      |
   | `MAX_BOOKING_MONTHS` | `3` (opcional)                                 |

5. **Deploy**. O build roda `prisma generate && prisma migrate deploy && next build`,
   então as migrações são aplicadas automaticamente a cada deploy.

## 4. Primeiro acesso

- Acesse a URL da Vercel → `/login`.
- Entre com o admin do seed: `admin@santaizabel.edu` / `admin123`
  **(troque a senha / crie usuários reais na aba Usuários).**
- Crie as telas públicas em **Telas públicas** e use os links `/display/<slug>`
  nos monitores.

---

## Observações

- **Branch que a Vercel publica**: por padrão a Vercel faz deploy de produção a
  partir da branch `main`. Pushes em outras branches geram *Preview Deployments*
  (ótimo para mostrar features ao cliente antes do merge).
- **Plano Hobby (grátis)** é para uso não comercial — adequado para a fase de
  avaliação. Para produção comercial, avaliar um plano pago.
- **Segredos** (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`) ficam só nas variáveis
  de ambiente da Vercel e no `.env` local — nunca no Git.
- **Seed em produção**: rode `npm run db:seed` localmente apontando o `.env` para
  o banco do Neon (ou pelo Neon SQL Editor). Não é executado no build.
- Para gerar dados de demonstração (apresentação): `node prisma/demo.js`.
