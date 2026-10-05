# Zion

<p align="center">
  <img src="public/assets/zion-logo-horizontal.png" alt="Zion" width="260" />
</p>

Zion is a local-first web application for creating and following Bible reading
plans. It works in the browser without an account or backend; plan and progress
data stay in the browser's local storage.

## Features

- Choose a start/end Bible chapter and a local start/target date.
- Follow a reading schedule based on the ordered reading template.
- Mark or unmark individual chapters, including chapters ahead of schedule.
- Recalculate pending readings while keeping today's assignment stable.
- Choose system, Gruvbox dark, or Gruvbox light appearance.
- Back up and restore plan data as JSON; export the current schedule as CSV.
- Print the schedule or save it as PDF using the browser's print dialog.

The application stores Bible references and reading structure only; it does not
contain Bible text or depend on a translation.

## Stack

- React and TypeScript
- Vite
- Bun 1.4.2
- Vitest and Playwright
- GitHub Actions and GitHub Pages

## Development

Requirements: [Bun 1.4.2](https://bun.sh/).

```bash
bun install
bun run dev
```

## Quality commands

```bash
bun run format
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run test:coverage
bun run build
```

Install Playwright's Chromium browser before running browser tests:

```bash
bunx playwright install chromium
bun run test:e2e
```

## Data and privacy

The plan, completed chapters, theme preference, and the current day's reading
snapshot are saved in this browser under a versioned local-storage key. There is
no account, backend, synchronization, or telemetry. Clearing browser data can
remove progress; use the JSON backup from **Settings** to keep a copy.

Imported JSON is validated before confirmation and replacement. Invalid files
do not replace the current data.

## Architecture

```text
src/data/       Bible metadata and ordered reading template
src/domain/     pure Bible, date, plan, validation, and scheduler logic
src/storage/    versioned local-storage state and validation
src/export/     JSON backup, CSV, and browser download helpers
src/app/        React application views and state coordination
src/features/   plan editor and settings interactions
```

The plan configuration, user progress, reading template, and current local date
are the source of truth. The schedule is a deterministic projection and is not
persisted as authoritative state; only today's assignment is snapshotted to
avoid shifting the target while reading.

## GitHub Pages

Deployments are manual through the **Deploy** workflow. It can deploy:

- a published release by entering its version (for example, `0.1.0`);
- the latest commit on `main` as a snapshot; or
- a specific 40-character commit SHA as a snapshot.

The **Create Release** workflow is also manual. It updates the package version
and changelog on `main`, validates the resulting commit, then creates the
annotated tag and GitHub Release. Do not create release tags manually.

Before the first deployment, choose **GitHub Actions** as the source in the
repository's **Settings → Pages**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for local
commands, conventions, architecture rules, and review expectations.

## License

[MIT](LICENSE).
