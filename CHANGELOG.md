# Changelog

## v1.1.0 - 2026-02-23

### Fixed

- **Blank canvas root cause #1**: Updated `schema.sequences` to match tldraw v2.208.0 — added 3 missing asset keys (`asset.bookmark`, `asset.image`, `asset.video`) and fixed 3 outdated versions (`draw` 2→4, `highlight` 1→3, `note` 9→10).
- **Blank canvas root cause #2**: Replaced base36 index factory with safe 61-char alphabet. Old factory generated invalid trailing-zero indices (`a10`) at counter 36+, breaking diagrams with >35 shapes.
- Fixed `copyFile` status logic in bootstrap — correctly reports "created" vs "updated".

### Added

- UTF-8 encoding troubleshooting note in SKILL.md and README.
- Schema validation and index safety checks in CI pipeline.

## v1.0.1 - 2026-02-23

- Fixed `SKILL.md` command examples to avoid duplicated `gen-tldr.mjs` path usage.
- Added warning for skipped edges when source/target nodes are missing.
- Added schema pinning/update guidance to `references/tldraw-compat.md`.
- Normalized recovery command path to `scripts/gen-tldr.mjs`.
- Updated `npm test` validation to check both `examples/diagram.tldr` and `examples/smoke-test.tldr`.
- Added GitHub Actions CI to run `npm test` on each push to `main` and on every pull request.
