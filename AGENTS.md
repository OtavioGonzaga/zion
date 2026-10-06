# Zion Agent Guidelines

## Purpose

Zion is a static, local-first web application for creating and following Bible
reading plans. It runs entirely in the browser and is deployable to GitHub
Pages; do not introduce a backend, account system, remote persistence, or
analytics.

## Development

- Use Bun 1.4.2 for dependency management, scripts, and CI.
- Run `bun run dev` for local development.
- Before completing a change, run `bun run format:check`, `bun run lint`,
  `bun run typecheck`, `bun run test`, and `bun run build`.
- Use `bun run test:e2e` after installing Playwright's Chromium browser.

## Architecture

- Keep Bible metadata and reading templates in `src/data/`.
- Keep pure domain logic in `src/domain/`; it must not import React.
- Keep local persistence isolated in `src/storage/` and import/export in
  `src/export/`.
- Keep React views and interactions in `src/app/`, `src/components/`, and
  `src/features/`.
- Model mutually exclusive application screens with one active view; do not
  introduce independent boolean flags for navigation state.
- Progress records completion facts. Schedules project pending readings, and
  completed-reading views are derived from progress rather than persisted.
- The scheduler is a pure projection, independent from React.
- The source of truth is the plan configuration, user progress, reading
  template, and current local date. The schedule is derived data, except that
  `dailyAssignment` snapshots today's target so progress cannot shift it mid-day.

## Domain Rules

- Represent calendar dates as local `YYYY-MM-DD` values. Do not use UTC
  timestamps or `toISOString()` as a calendar-day identity.
- Do not store Bible text or introduce a dependency on a Bible translation.
- Preserve template reading blocks: the scheduler may combine blocks, but may
  not split an effective block between days.
- Corrupt or unsupported local-storage data must not be overwritten by an
  automatic fallback save; persist a replacement only after an explicit user
  action.
- Keep the application name in `src/config/app.ts`; do not duplicate it in
  product code.
- PWA configuration must respect Vite's dynamic `base`. Prefer relative URLs
  and never hardcode `/zion/` or `/` in manifest, service-worker, or shortcut
  URLs when a relative URL can be used.
- Service-worker updates must be user-confirmed. Do not introduce automatic
  page reloads that can discard unsaved plan edits.
- The service worker caches application assets only. User plan and progress
  remain in the existing local-storage schema.
- Prefer `generateSW` configuration over a custom service worker. Move to
  `injectManifest` only when a concrete requirement cannot be expressed with
  the generated worker.

## Scope And Quality

- Keep the application static and compatible with GitHub Pages. Do not add
  server-dependent routing; use local state or hash routing if navigation is
  needed.
- Prefer small functions, explicit data, and few dependencies over framework
  abstractions or global state managers.
- Use `lucide-react` for interface icons. Do not add a full component/UI framework
  only to provide icons or basic controls.
- Prefer native HTML primitives and the project's CSS tokens for small controls,
  menus, and confirmation dialogs.
- Use semantic HTML, keyboard-accessible controls, visible focus states, and
  responsive mobile-first layouts.
- Use Vitest for domain, storage, and export behavior; use Playwright for user
  flows.

## Versioning And Releases

- Use Conventional Commits and target pull requests at `main`.
- Record notable changes under `[Unreleased]` in `CHANGELOG.md`.
- Follow Semantic Versioning and Keep a Changelog.
- Do not change the package version in ordinary changes; releases are explicit
  operations.
- Release metadata must be prepared by the tested Bun tooling under
  `scripts/release/`; workflow YAML orchestrates but does not transform the
  changelog inline. Run validation before pushing the release commit.

## Agent Material

- Keep reusable agent material in `.agents/`.
- `.agents/artifacts/` is local and entirely unversioned. Do not commit source
  artifacts or mention their origin in product code or docs.
