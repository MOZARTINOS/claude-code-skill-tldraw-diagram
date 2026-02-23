---
name: tldraw-json-to-tldr
description: Generate and repair VS Code-compatible tldraw `.tldr` files from diagram JSON. Use when asked to build or update architecture diagrams from JSON, fix blank tldraw canvas issues in VS Code, or enforce current tldraw schema compatibility.
---

# tldraw-json-to-tldr

## Setup

The generator script `gen-tldr.mjs` must be present in the user's project. Typical locations:
- `scripts/gen-tldr.mjs` (if repo was cloned directly)
- `skills/tldraw-json-to-tldr/scripts/gen-tldr.mjs` (if installed as a subdirectory)

Before running commands, locate `gen-tldr.mjs` in the project with a file search.

## Quick Workflow
1. Locate `gen-tldr.mjs` in the project directory.
2. Locate input JSON (default: `.diagrams/diagram.json`).
3. Run the generator script.
4. Validate that output is valid JSON.
5. Run smoke generation if blank canvas is still reported.
6. Re-open file in VS Code and verify shapes are visible.

## Commands

Replace `<path-to-gen>` with the actual path to `gen-tldr.mjs` in the project:

```bash
node <path-to-gen>/gen-tldr.mjs --help
node <path-to-gen>/gen-tldr.mjs --in .diagrams/diagram.json --out .diagrams/diagram.tldr
node <path-to-gen>/gen-tldr.mjs --smoke --out .diagrams/smoke-test.tldr
```

## Input Format
- `title: string` — diagram title
- `nodes: [{ id, label, group }]` — nodes with group-based column layout
- `edges: [{ from, to, label }]` — arrows between nodes

## Output Contract
The generated `.tldr` file uses:
- `tldrawFileFormatVersion: 1`
- `schema.schemaVersion: 2`
- `props.richText` (ProseMirror format, NOT legacy `props.text`)
- Full `schema.sequences` with all `com.tldraw.*` migration keys
- Required base records: `document:document`, `page:page`, `camera:page:page`

## Troubleshooting
1. Generate smoke file and open it first.
2. If smoke file is visible but main diagram is blank, regenerate main output from JSON.
3. If both are blank, use VS Code `Developer: Reload Window` and re-open.
4. Never use legacy `props.text` — always use `props.richText`.
5. Never reduce `schema.sequences` to empty — all keys are required.

## Shape Property Reference

### `geo` shape props
`geo, dash, url, w, h, growY, scale, labelColor, color, fill, size, font, align, verticalAlign, richText`

### `arrow` shape props
`kind, labelColor, color, fill, dash, size, arrowheadStart, arrowheadEnd, font, start, end, bend, richText, labelPosition, scale, elbowMidPoint`

### `text` shape props
`richText, size, font, textAlign, color, w, scale, autoSize`
