import fs from "node:fs";

const EXPECTED_SEQUENCES = {
  "com.tldraw.store": 5,
  "com.tldraw.asset": 1,
  "com.tldraw.camera": 1,
  "com.tldraw.document": 2,
  "com.tldraw.instance": 26,
  "com.tldraw.instance_page_state": 5,
  "com.tldraw.instance_presence": 6,
  "com.tldraw.page": 1,
  "com.tldraw.pointer": 1,
  "com.tldraw.shape": 4,
  "com.tldraw.asset.bookmark": 2,
  "com.tldraw.asset.image": 5,
  "com.tldraw.asset.video": 5,
  "com.tldraw.shape.arrow": 8,
  "com.tldraw.shape.bookmark": 2,
  "com.tldraw.shape.draw": 4,
  "com.tldraw.shape.embed": 4,
  "com.tldraw.shape.frame": 1,
  "com.tldraw.shape.geo": 11,
  "com.tldraw.shape.group": 0,
  "com.tldraw.shape.highlight": 3,
  "com.tldraw.shape.image": 5,
  "com.tldraw.shape.line": 5,
  "com.tldraw.shape.note": 10,
  "com.tldraw.shape.text": 4,
  "com.tldraw.shape.video": 4,
  "com.tldraw.binding": 0,
  "com.tldraw.binding.arrow": 1,
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/validate.mjs <file1.tldr> [file2.tldr ...]");
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const tldr = JSON.parse(fs.readFileSync(file, "utf8"));
  const errors = [];

  if (tldr.tldrawFileFormatVersion !== 1) {
    errors.push(`tldrawFileFormatVersion=${tldr.tldrawFileFormatVersion}, expected 1`);
  }
  if (tldr.schema?.schemaVersion !== 2) {
    errors.push(`schemaVersion=${tldr.schema?.schemaVersion}, expected 2`);
  }

  const seq = tldr.schema?.sequences ?? {};
  const seqKeys = Object.keys(seq);
  const expectedKeys = Object.keys(EXPECTED_SEQUENCES);

  for (const key of expectedKeys) {
    if (!(key in seq)) {
      errors.push(`missing sequence key: ${key}`);
    } else if (seq[key] !== EXPECTED_SEQUENCES[key]) {
      errors.push(`${key}=${seq[key]}, expected ${EXPECTED_SEQUENCES[key]}`);
    }
  }

  for (const key of seqKeys) {
    if (!(key in EXPECTED_SEQUENCES)) {
      errors.push(`unexpected sequence key: ${key}`);
    }
  }

  if (!Array.isArray(tldr.records)) {
    errors.push("records is not an array");
  } else {
    const hasDoc = tldr.records.some((r) => r.id === "document:document");
    const hasPage = tldr.records.some((r) => r.id === "page:page");
    const hasCam = tldr.records.some((r) => r.id === "camera:page:page");
    if (!hasDoc) errors.push("missing document:document record");
    if (!hasPage) errors.push("missing page:page record");
    if (!hasCam) errors.push("missing camera:page:page record");

    const indices = tldr.records.filter((r) => r.index).map((r) => r.index);
    const trailingZero = indices.filter((idx) => idx.endsWith("0"));
    if (trailingZero.length > 0) {
      errors.push(`trailing-zero indices: ${trailingZero.join(", ")}`);
    }

    const dupes = indices.filter((v, i, a) => a.indexOf(v) !== i);
    if (dupes.length > 0) {
      errors.push(`duplicate indices: ${[...new Set(dupes)].join(", ")}`);
    }

    const legacyText = tldr.records.filter(
      (r) => r.props && "text" in r.props && !("richText" in r.props)
    );
    if (legacyText.length > 0) {
      errors.push(`${legacyText.length} shape(s) use legacy props.text instead of richText`);
    }
  }

  if (errors.length > 0) {
    console.error(`FAIL: ${file}`);
    for (const err of errors) console.error(`  - ${err}`);
    failed = true;
  } else {
    console.log(`PASS: ${file}`);
  }
}

if (failed) process.exit(1);
