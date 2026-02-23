# Changelog

## v1.0.1 - 2026-02-23

- Fixed `SKILL.md` command examples to avoid duplicated `gen-tldr.mjs` path usage.
- Added warning for skipped edges when source/target nodes are missing.
- Added schema pinning/update guidance to `references/tldraw-compat.md`.
- Normalized recovery command path to `scripts/gen-tldr.mjs`.
- Updated `npm test` validation to check both `examples/diagram.tldr` and `examples/smoke-test.tldr`.
- Added GitHub Actions CI to run `npm test` on each push to `main` and on every pull request.
