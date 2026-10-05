# Contributing

## Requirements

- Bun 1.4.2

## Setup

```bash
bun install
```

## Workflow

- Create branches and pull requests against `main`.
- Use Conventional Commits, such as `feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `build:`, `ci:`, and `chore:`.
- Add notable user-facing or operational changes to `CHANGELOG.md` under
  `[Unreleased]`.
- Do not update the package version in ordinary pull requests.

## Before Requesting Review

Run:

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
```

Run `bun run test:e2e` for changes that affect browser behavior.

## Releases

Releases follow Semantic Versioning. Run the **Create Release** workflow from
`main` with the version without its `v` prefix. Release metadata rules live in
the tested TypeScript/Bun script `scripts/release/prepare.ts`; the workflow
prepares a local candidate, runs all quality gates, and only then pushes it and
creates the matching annotated `vX.Y.Z` tag and GitHub Release. The GitHub
Release uses generated notes; the changelog is the curated project history.

Do not update the version, create release tags, or publish GitHub Releases
manually. Use the **Deploy** workflow to deploy a published release or a
snapshot of `main` (latest or a specific commit SHA).
