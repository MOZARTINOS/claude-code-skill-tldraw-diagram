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
2. If not found, run bootstrap:
   - `node skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs --target .`
   - `node "$HOME/.claude/skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs" --target .` (Bash/Zsh)
   - `node "$env:USERPROFILE/.claude/skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs" --target .` (PowerShell)
3. Locate input JSON (default: `.diagrams/diagram.json`).
4. Run the generator script.
5. Validate that output is valid JSON.
6. If blank canvas is reported, run doctor (bootstrap + workspace cache reset):
   - `node "$env:USERPROFILE/.claude/skills/tldraw-json-to-tldr/scripts/doctor-vscode-tldraw.mjs" --target . --reset-workspace-cache` (PowerShell)
   - `node "$HOME/.claude/skills/tldraw-json-to-tldr/scripts/doctor-vscode-tldraw.mjs" --target . --reset-workspace-cache` (Bash/Zsh)
7. Re-open file in VS Code and verify shapes are visible.

## Commands

Use the actual path where `gen-tldr.mjs` was found. Examples for each layout:

```bash
# Bootstrap current project if script/config is missing:
node skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs --target .
node "$HOME/.claude/skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs" --target . # Bash/Zsh
node "$env:USERPROFILE/.claude/skills/tldraw-json-to-tldr/scripts/bootstrap-project.mjs" --target . # PowerShell

# If canvas is still blank in this workspace:
node "$env:USERPROFILE/.claude/skills/tldraw-json-to-tldr/scripts/doctor-vscode-tldraw.mjs" --target . --reset-workspace-cache # PowerShell
node "$HOME/.claude/skills/tldraw-json-to-tldr/scripts/doctor-vscode-tldraw.mjs" --target . --reset-workspace-cache # Bash/Zsh

# If scripts/ is at project root:
node scripts/gen-tldr.mjs --in .diagrams/diagram.json --out .diagrams/diagram.tldr
node scripts/gen-tldr.mjs --smoke --out .diagrams/smoke-test.tldr

# If installed as a subdirectory:
node skills/tldraw-json-to-tldr/scripts/gen-tldr.mjs --in .diagrams/diagram.json --out .diagrams/diagram.tldr
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
6. Keep `.diagrams/diagram.json` in UTF-8 (without BOM) and standard double quotes.

## Shape Property Reference

### `geo` shape props
`geo, dash, url, w, h, growY, scale, labelColor, color, fill, size, font, align, verticalAlign, richText`

### `arrow` shape props
`kind, labelColor, color, fill, dash, size, arrowheadStart, arrowheadEnd, font, start, end, bend, richText, labelPosition, scale, elbowMidPoint`

### `text` shape props
`richText, size, font, textAlign, color, w, scale, autoSize`
