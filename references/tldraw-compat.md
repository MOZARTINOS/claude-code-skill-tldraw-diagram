# tldraw Compatibility Contract

Use this contract when generating or debugging `.tldr` files for VS Code `tldraw-org.tldraw-vscode`.

## Required Top-Level Fields
- `tldrawFileFormatVersion: 1`
- `schema.schemaVersion: 2`
- `schema.sequences` containing current `com.tldraw.*` migration keys
- `records` as an array of tldraw records

## Required Base Records
- `document:document` with `gridSize`, `name`, `meta`
- `page:page` with `name`, `index`, `meta`
- `camera:page:page` with `x`, `y`, `z`, `meta`

## Shape Rules
- Use `props.richText` for shape text content.
- Do not rely on legacy `props.text` for `text`/`geo` shapes.
- Include `meta` on generated shape records.

### `geo` shape props
Use:
`geo,dash,url,w,h,growY,scale,labelColor,color,fill,size,font,align,verticalAlign,richText`

### `arrow` shape props
Use:
`kind,labelColor,color,fill,dash,size,arrowheadStart,arrowheadEnd,font,start,end,bend,richText,labelPosition,scale,elbowMidPoint`

## Common Blank-Canvas Causes
- Output generated in old/legacy schema.
- Missing/incorrect `schema.sequences`.
- Missing required base records.
- Invalid shape props rejected by schema validation.

## Quick Recovery Steps
1. Generate smoke file:
   `node skills/tldraw-json-to-tldr/scripts/gen-tldr.mjs --smoke`
2. Open smoke file in VS Code.
3. If smoke works, regenerate main diagram from JSON.
4. If smoke fails, reload VS Code window and retry.

