import fs from "node:fs";
import path from "node:path";

const NODE_W = 200;
const NODE_H = 80;
const COL_X_START = 100;
const COL_X_GAP = 500;
const NODE_Y_START = 200;
const NODE_Y_GAP = 220;
const GROUP_LABEL_Y = 150;
const DEFAULT_INPUT_REL = path.join(".diagrams", "diagram.json");
const DEFAULT_OUTPUT_REL = path.join(".diagrams", "diagram.tldr");
const DEFAULT_SMOKE_OUTPUT_REL = path.join(".diagrams", "smoke-test.tldr");
const SCHEMA = {
  schemaVersion: 2,
  sequences: {
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
  },
};

function printUsage() {
  console.log(`Usage:
  node scripts/gen-tldr.mjs [--in <file>] [--out <file>] [--smoke]

Options:
  --in <file>     Input diagram JSON file (default: .diagrams/diagram.json)
  --out <file>    Output .tldr file (default: .diagrams/diagram.tldr)
  --smoke         Generate a minimal smoke-test .tldr
  --help          Show this help`);
}

function parseArgs(argv) {
  const cwd = process.cwd();
  const options = {
    inputPath: path.resolve(cwd, DEFAULT_INPUT_REL),
    outputPath: path.resolve(cwd, DEFAULT_OUTPUT_REL),
    smoke: false,
    help: false,
    outputPathExplicit: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--smoke") {
      options.smoke = true;
      continue;
    }
    if (arg === "--in") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --in");
      }
      options.inputPath = path.resolve(cwd, value);
      i += 1;
      continue;
    }
    if (arg === "--out") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --out");
      }
      options.outputPath = path.resolve(cwd, value);
      options.outputPathExplicit = true;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.smoke && !options.outputPathExplicit) {
    options.outputPath = path.resolve(cwd, DEFAULT_SMOKE_OUTPUT_REL);
  }

  return options;
}

function buildIndexFactory() {
  let index = 0;
  return () => `a${(++index).toString(36)}`;
}

function center(point) {
  return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 };
}

function readDiagramJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.nodes)) {
    console.warn("Warning: 'nodes' is not an array — treating as empty");
  }
  if (!Array.isArray(parsed.edges)) {
    console.warn("Warning: 'edges' is not an array — treating as empty");
  }

  return {
    title: typeof parsed.title === "string" ? parsed.title : "Diagram",
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : [],
  };
}

function toRichText(text) {
  const lines = String(text).split("\n");
  return {
    type: "doc",
    content: lines.map((line) => {
      if (!line) return { type: "paragraph" };
      return {
        type: "paragraph",
        content: [{ type: "text", text: line }],
      };
    }),
  };
}

function buildSmokeTestTldr() {
  return {
    tldrawFileFormatVersion: 1,
    schema: SCHEMA,
    records: [
      {
        typeName: "document",
        id: "document:document",
        gridSize: 10,
        name: "",
        meta: {},
      },
      {
        typeName: "page",
        id: "page:page",
        name: "Page 1",
        index: "a1",
        meta: {},
      },
      {
        typeName: "camera",
        id: "camera:page:page",
        x: 0,
        y: 0,
        z: 1,
        meta: {},
      },
      {
        typeName: "shape",
        id: "shape:smoke_box",
        type: "geo",
        x: 220,
        y: 220,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        parentId: "page:page",
        index: "a1",
        meta: {},
        props: {
          geo: "rectangle",
          dash: "draw",
          url: "",
          w: 320,
          h: 140,
          growY: 0,
          scale: 1,
          labelColor: "black",
          color: "blue",
          fill: "semi",
          size: "l",
          font: "sans",
          align: "middle",
          verticalAlign: "middle",
          richText: toRichText("SMOKE TEST"),
        },
      },
    ],
  };
}

function buildTldr(diagram) {
  const nextIndex = buildIndexFactory();
  const records = [
    {
      typeName: "document",
      id: "document:document",
      gridSize: 10,
      name: "",
      meta: {},
    },
    {
      typeName: "page",
      id: "page:page",
      name: "Page 1",
      index: "a1",
      meta: {},
    },
    {
      typeName: "camera",
      id: "camera:page:page",
      x: 0,
      y: 0,
      z: 1,
      meta: {},
    },
    {
      typeName: "shape",
      id: "shape:gen_title",
      type: "text",
      x: 100,
      y: 80,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      parentId: "page:page",
      index: nextIndex(),
      meta: {},
      props: {
        richText: toRichText(diagram.title),
        size: "xl",
        font: "sans",
        textAlign: "start",
        color: "black",
        w: 600,
        scale: 1,
        autoSize: true,
      },
    },
  ];

  const groups = [];
  const groupToCol = new Map();
  for (const node of diagram.nodes) {
    const group = typeof node.group === "string" ? node.group : "Ungrouped";
    if (!groupToCol.has(group)) {
      groupToCol.set(group, groups.length);
      groups.push(group);
    }
  }

  groups.forEach((group, i) => {
    records.push({
      typeName: "shape",
      id: `shape:gen_grp_${i}`,
      type: "text",
      x: COL_X_START + i * COL_X_GAP,
      y: GROUP_LABEL_Y,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      parentId: "page:page",
      index: nextIndex(),
      meta: {},
      props: {
        richText: toRichText(group),
        size: "m",
        font: "sans",
        textAlign: "start",
        color: "grey",
        w: 200,
        scale: 1,
        autoSize: true,
      },
    });
  });

  const nodePos = new Map();
  const colRowCount = new Map();
  const seenNodeIds = new Set();

  for (const node of diagram.nodes) {
    if (!node || typeof node !== "object") continue;

    const id = typeof node.id === "string" ? node.id : "";
    if (!id) continue;

    if (seenNodeIds.has(id)) {
      console.warn(`Warning: duplicate node id "${id}" — skipping`);
      continue;
    }
    seenNodeIds.add(id);

    const label = typeof node.label === "string" ? node.label : id;
    const group = typeof node.group === "string" ? node.group : "Ungrouped";
    const col = groupToCol.get(group) ?? 0;
    const row = colRowCount.get(col) ?? 0;
    colRowCount.set(col, row + 1);

    const x = COL_X_START + col * COL_X_GAP;
    const y = NODE_Y_START + row * NODE_Y_GAP;
    const shapeId = `shape:gen_n_${nextIndex()}`;

    records.push({
      typeName: "shape",
      id: shapeId,
      type: "geo",
      x,
      y,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      parentId: "page:page",
      index: nextIndex(),
      meta: {},
      props: {
        geo: "rectangle",
        dash: "draw",
        url: "",
        w: NODE_W,
        h: NODE_H,
        growY: 0,
        scale: 1,
        labelColor: "black",
        color: "black",
        fill: "semi",
        size: "m",
        font: "sans",
        align: "middle",
        verticalAlign: "middle",
        richText: toRichText(label),
      },
    });

    nodePos.set(id, { x, y, shapeId });
  }

  let edgeIndex = 0;
  for (const edge of diagram.edges) {
    if (!edge || typeof edge !== "object") continue;
    const from = typeof edge.from === "string" ? edge.from : "";
    const to = typeof edge.to === "string" ? edge.to : "";
    if (!from || !to) continue;

    const fromNode = nodePos.get(from);
    const toNode = nodePos.get(to);
    if (!fromNode || !toNode) {
      const missing = [!fromNode && from, !toNode && to].filter(Boolean);
      console.warn(`Warning: edge "${from}" -> "${to}" skipped — unknown node(s): ${missing.join(", ")}`);
      continue;
    }

    const start = center(fromNode);
    const end = center(toNode);
    const arrowId = `shape:gen_e_${edgeIndex}`;
    const label = typeof edge.label === "string" ? edge.label : "";

    records.push({
      typeName: "shape",
      id: arrowId,
      type: "arrow",
      x: start.x,
      y: start.y,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      parentId: "page:page",
      index: nextIndex(),
      meta: {},
      props: {
        kind: "arc",
        labelColor: "black",
        color: "black",
        fill: "none",
        dash: "draw",
        size: "m",
        arrowheadStart: "none",
        arrowheadEnd: "arrow",
        font: "sans",
        start: { x: 0, y: 0 },
        end: { x: end.x - start.x, y: end.y - start.y },
        bend: 0,
        richText: toRichText(label),
        labelPosition: 0.5,
        scale: 1,
        elbowMidPoint: 0.5,
      },
    });

    edgeIndex += 1;
  }

  return {
    tldrawFileFormatVersion: 1,
    schema: SCHEMA,
    records,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const tldr = options.smoke
    ? buildSmokeTestTldr()
    : buildTldr(readDiagramJson(options.inputPath));

  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
  fs.writeFileSync(options.outputPath, `${JSON.stringify(tldr, null, 2)}\n`, "utf8");
  console.log(`Generated ${options.outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
