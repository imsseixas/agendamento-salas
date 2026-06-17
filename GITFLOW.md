# Plano de Git Flow — Agendamento de Salas

Estratégia de branches e fluxo de trabalho do projeto. Baseado no **Git Flow**,
adaptado para um time pequeno com avaliação contínua do cliente.

## Branches permanentes

| Branch    | Propósito                                                                 |
|-----------|---------------------------------------------------------------------------|
| `main`    | Código **estável / em produção**. É o que vai para avaliação do cliente. Sempre deployável. |
| `develop` | Linha de **integração**. Reúne as features prontas antes de virar release. |

> `main` deve ser **protegida** no GitHub (sem push direto; só via Pull Request).

## Branches temporárias

| Prefixo      | Origem    | Volta para         | Uso                                              |
|--------------|-----------|--------------------|--------------------------------------------------|
| `feature/*`  | `develop` | `develop`          | Nova funcionalidade (ex.: `feature/checkin-presenca`) |
| `fix/*`      | `develop` | `develop`          | Correção de bug não urgente                      |
| `release/*`  | `develop` | `main` **e** `develop` | Preparar uma versão (ajustes finais, bump de versão) |
| `hotfix/*`   | `main`    | `main` **e** `develop` | Correção urgente em produção                     |

### Exemplos de ciclo

```bash
# Nova funcionalidade
git checkout develop && git pull
git checkout -b feature/crud-salas
# ...commits...
git push -u origin feature/crud-salas
# Abrir Pull Request: feature/crud-salas -> develop

# Preparar versão
git checkout -b release/1.1.0 develop
# bump de versão, ajustes, testes
git checkout main && git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Versão 1.1.0"
git checkout develop && git merge --no-ff release/1.1.0
git push origin main develop --tags

# Correção urgente em produção
git checkout -b hotfix/1.1.1 main
# ...fix...
git checkout main && git merge --no-ff hotfix/1.1.1
git tag -a v1.1.1 -m "Hotfix 1.1.1"
git checkout develop && git merge --no-ff hotfix/1.1.1
git push origin main develop --tags
```

## Convenção de commits (Conventional Commits)

```
<tipo>(escopo opcional): descrição curta no imperativo

[corpo opcional]
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`.

Exemplos:
- `feat(calendario): visão semanal estilo Google Calendar`
- `fix(bookings): corrige checagem de conflito em recorrência`
- `docs: atualiza README com fluxo de telas públicas`
- `chore: bump next para 15.5.19 (CVE)`

## Versionamento

Usar **SemVer** (`MAJOR.MINOR.PATCH`) com tags `vX.Y.Z`:
- **MAJOR**: mudanças incompatíveis.
- **MINOR**: novas funcionalidades retrocompatíveis.
- **PATCH**: correções.

## Pull Requests

1. Toda mudança entra por PR (nunca push direto em `main`/`develop`).
2. Título no padrão Conventional Commits.
3. Descrição com **o que** mudou e **como testar**.
4. Pelo menos 1 revisão aprovada antes do merge.
5. Preferir **Squash & Merge** para `feature/*` (histórico limpo).

## Recomendações de CI (próximo passo)

GitHub Actions em PRs para `develop`/`main`:
- `npm ci`
- `npm run lint`
- `npm run build` (inclui `prisma generate`)
- (futuro) `npm test`

## Ambientes

- **dev**: SQLite (`DATABASE_URL="file:./dev.db"`).
- **produção**: PostgreSQL — trocar `provider` no `schema.prisma` e a `DATABASE_URL`.
- Segredos (`JWT_SECRET`, `DATABASE_URL`) **nunca** versionados — usar `.env` (ignorado) e `.env.example` como modelo.

## Fluxo simplificado (alternativa para fase de avaliação)

Enquanto o time for pequeno e o foco for iterar rápido com o cliente, é aceitável
usar **GitHub Flow**: branches `feature/*` saindo direto de `main` via PR, sem `develop`.
Quando o projeto estabilizar e tiver releases planejadas, migrar para o Git Flow completo acima.
