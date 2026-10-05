# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Add primary navigation between Today, Plan, and completed readings, with reversible progress and immediate undo feedback.

### Changed

- Replace overlapping navigation states with one exclusive application view and keep settings and plan editing inside a consistent shell.
- Improve mobile navigation, focus management, and user feedback.
- Simplify UI dependencies with native controls and lightweight interface icons.
- Improve navigation history handling while editing plans and preserve the originating view after printing.

### Fixed

- Synchronize end-to-end navigation coverage with the rendered reading view.
- Reset completed-reading filters when their selected book no longer has completed chapters.
- Preserve browser history when canceling navigation with unsaved plan changes.

## [0.2.0] - 2026-10-05

### Added

- Bulk chapter progress controls and the optional “Já li até…” shortcut when creating or editing a plan.

### Fixed

- Keep today's reading assignment stable while adapting future readings to progress changes.
- Reserve frozen daily chapters before projecting the future schedule, CSV, and print view.
- Prevent plan edits from inferring newly completed chapters from the “Já li até…” shortcut.
- Preserve incompatible or corrupt local data until the user explicitly replaces it.
- Distribute pending reading blocks across available days, including highly uneven block weights.
- Refresh the active local date at midnight and when the app regains focus.
- Keep CSV export aligned with the frozen daily assignment and recalculated future schedule.

### Changed

- Make completed chapter progress reversible in bulk from settings.

## [0.1.1] - 2026-10-05

### Fixed

- Recalculate today's reading from current progress so it matches the complete schedule.

## [0.1.0] - 2026-10-05

### Fixed

- Ensure Print / Save as PDF renders the complete reading schedule after closing settings, with Zion branding and print-friendly colors.

### Added

- Canonical metadata for the 66-book Bible and a validated, ordered 365-block reading template.
- Gruvbox dark/light themes, responsive dashboard shell, and theme preference control.
- Pure Bible-reference, local-date, reading-schedule, and progress-projection domain logic with invariant-focused tests.
- Versioned local storage with schema validation and non-crashing fallback behavior.
- JSON backup/restore, CSV schedule download, print-to-PDF view, and confirmed reset/removal controls.
- CI quality gates, GitHub Pages deployment, release validation, Dependabot, and pull request template.
- Initial browser regression coverage for backup restoration, expired plans, themes, and responsive widths.
- Updated project documentation for the delivered product behavior and local privacy model.
- Initial React, TypeScript, Vite, Bun, Vitest, and Playwright foundation.
