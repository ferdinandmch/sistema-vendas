# pipeline-vendas Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-30

## Active Technologies
- PostgreSQL via Prisma (002-pipeline-stages)
- TypeScript 5.x + Next.js App Router, Prisma, Clerk, Zod (003-deal-management)
- PostgreSQL via Prisma (transacoes com `$transaction`) (004-stage-movement)
- PostgreSQL via Prisma (somente leitura nesta feature) (006-stage-history)
- TypeScript 5.x + Next.js 16 App Router, Prisma 6, Clerk v7, Zod (007-api-refinada)
- PostgreSQL via Prisma (somente leitura nesta feature — zero migracoes) (007-api-refinada)
- TypeScript 5.x + Next.js 16 (App Router), Clerk v7, shadcn/ui + Tailwind CSS (a instalar), TanStack Query `@tanstack/react-query` (a instalar), lucide-react (a instalar com shadcn) (008-pipeline-ui)
- PostgreSQL via Prisma (somente leitura nesta feature — zero migrações) (008-pipeline-ui)
- TypeScript 5.x + Next.js 16 App Router, @dnd-kit/core, @dnd-kit/utilities, sonner, TanStack Query v5, shadcn/ui, Clerk v7 (009-pipeline-dnd)
- TypeScript 5.x + Next.js 16 App Router, TanStack Query v5, shadcn/ui, Clerk v7, lucide-react (010-deal-page)
- PostgreSQL via Prisma — zero migrações (schema já tem tudo) (012-deal-ui-loop)

- TypeScript 5.x + Next.js App Router, Clerk, Prisma, Zod (001-clerk-auth)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

pnpm test; pnpm run lint

## Code Style

TypeScript 5.x: Follow standard conventions

## Recent Changes
- 012-deal-ui-loop: Added TypeScript 5.x + Next.js 16 App Router, TanStack Query v5, shadcn/ui, Clerk v7, lucide-react
- 010-deal-page: Added TypeScript 5.x + Next.js 16 App Router, TanStack Query v5, shadcn/ui, Clerk v7, lucide-react
- 009-pipeline-dnd: Added TypeScript 5.x + Next.js 16 App Router, @dnd-kit/core, @dnd-kit/utilities, sonner, TanStack Query v5, shadcn/ui, Clerk v7


## Speckit Workflow

This project uses Speckit for spec-driven development. The workflow commands are available as slash commands:

1. `/speckit-specify` - Create a feature spec from a description
2. `/speckit-clarify` - Clarify ambiguities in the spec
3. `/speckit-plan` - Generate implementation plan
4. `/speckit-tasks` - Generate tasks from the plan
5. `/speckit-analyze` - Cross-artifact consistency analysis
6. `/speckit-checklist` - Generate quality checklists
7. `/speckit-implement` - Execute implementation tasks
8. `/speckit-constitution` - Update project constitution
9. `/speckit-taskstoissues` - Convert tasks to GitHub issues

Key files:
- Constitution: `.specify/memory/constitution.md`
- Templates: `.specify/templates/`
- Scripts: `.specify/scripts/powershell/`
- Specs: `specs/<branch-name>/`

## Domain Skills (Available as Commands)

- `/clerk` - Clerk auth routing (setup, patterns, etc.)
- `/clerk-setup` - Add Clerk authentication to the project
- `/clerk-nextjs-patterns` - Advanced Next.js + Clerk patterns
- `/postgresql-code-review` - PostgreSQL code review
- `/postgresql-optimization` - PostgreSQL optimization
- `/tanstack-query-best-practices` - TanStack Query patterns
- `/update-docs` - Documentation update workflow
- `/web-design-guidelines` - Web UI guidelines review
- `/web-design-reviewer` - Visual design review

## Auto-Reference Skills

When working on relevant tasks, consult these skill files automatically:
- **shadcn/ui**: `.agents/skills/shadcn/SKILL.md` - When working with UI components
- **Next.js best practices**: `.agents/skills/next-best-practices/SKILL.md` - When writing Next.js code
- **Frontend design**: `.agents/skills/frontend-design/SKILL.md` - When building pages, components, or any UI — apply distinctive design direction, avoid generic aesthetics

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
