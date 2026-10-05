# Zion

Zion is a local-first web application for creating and following Bible reading
plans.

The project is under initial development. It will run entirely in the browser,
store data locally, and be deployable as a static GitHub Pages site.

## Stack

- React
- TypeScript
- Vite
- Bun
- Vitest
- Playwright

## Development

Requirements: [Bun 1.4.2](https://bun.sh/).

```bash
bun install
bun run dev
```

## Commands

```bash
bun run format
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run test:coverage
bun run test:e2e
bun run build
```

Install the Playwright browser before running end-to-end tests:

```bash
bunx playwright install chromium
```

## Architecture

The domain, persistence, import/export, and React interface are intentionally
separate. Reading schedules will be derived from the plan configuration,
template, progress, and current local date.

## Privacy

Planned reading-plan data is stored only in the current browser. No account,
backend, or telemetry is part of the project.

## License

[MIT](LICENSE).
