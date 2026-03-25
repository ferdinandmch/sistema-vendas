# pipeline-vendas Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-25

## Active Technologies
- PostgreSQL via Prisma (002-pipeline-stages)

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
- 002-pipeline-stages: Added TypeScript 5.x + Next.js App Router, Clerk, Prisma, Zod
- 002-pipeline-stages: Added TypeScript 5.x + Next.js App Router, Clerk, Prisma, Zod

- 001-clerk-auth: Added TypeScript 5.x + Next.js App Router, Clerk, Prisma, Zod

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

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
