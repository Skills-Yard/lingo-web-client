// Checks the kit docs and the data files against the code, with no server and no browser (a few seconds).
// Usage: node scripts/kit-audit.mjs          (run it from the repo root; exits 1 if something is wrong)
//
// It answers: does every component the data names still exist in code? how much of the data is "kit:*"? which
// components stand on one screen only (the merge to-do list)? does any doc name a file that is gone, or a kit
// component the kit no longer has? Run it after a merge, and before trusting what docs/kit-handoff.md says.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repo = process.argv[2] ?? process.cwd();
const read = (path) => readFileSync(join(repo, path), "utf8");
const MODULES = ["datatypes", "operators", "conditions", "variable"];
let problems = 0;
const problem = (message) => {
  problems += 1;
  console.log(`  PROBLEM: ${message}`);
};

// ---------- 1. Names the data uses vs what the code can resolve (mirrors src/components/kit/runtime/registry.ts) ----------
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
const registry = read("src/components/kit/runtime/registry.ts");
const aliasFile = new Map([...registry.matchAll(/import \* as (\w+) from "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const fileOf = (spec) => {
  const base = spec.replace(/^@\//, "src/");
  return ["", ".tsx", ".ts", "/index.tsx", "/index.ts"].map((ext) => base + ext).find((p) => existsSync(join(repo, p)) && /\.tsx?$/.test(p)) ?? null;
};
const exportsOf = (spec) => {
  const file = fileOf(spec);
  return file ? [...read(file).matchAll(/export (?:function|const|class) ([A-Z]\w*)/g)].map((m) => m[1]) : [];
};
const resolvable = new Set();
for (const m of read("src/components/kit/registry.ts").matchAll(/^\s*"?([a-z0-9-]+)"?: [A-Z]\w*,/gm)) resolvable.add(m[1]);
const content = registry.match(/const CONTENT[^=]*= \{([\s\S]*?)\n\};/)?.[1] ?? "";
for (const line of content.split("\n")) {
  const m = line.match(/^\s*(\w+): \[([^\]]*)\]/);
  if (!m) continue;
  for (const alias of m[2].split(",").map((s) => s.trim()).filter(Boolean)) {
    for (const exported of exportsOf(aliasFile.get(alias) ?? "")) {
      resolvable.add(kebab(exported));
      resolvable.add(`${kebab(exported)}-${m[1]}`); // the name a duplicate gets: suffixed with where it came from
    }
  }
}

const data = Object.fromEntries(MODULES.map((id) => [id, JSON.parse(read(`src/data/modules/${id}.json`))]));
const used = new Map(); // "kit:name" -> Set("module:step")
let nodes = 0;
const walk = (node, where) => {
  if (Array.isArray(node)) node.forEach((item) => walk(item, where));
  else if (node && typeof node === "object") {
    if (typeof node.$ === "string") {
      nodes += 1;
      if (node.$.startsWith("kit:")) (used.get(node.$) ?? used.set(node.$, new Set()).get(node.$)).add(where);
    }
    Object.values(node).forEach((value) => walk(value, where));
  }
};
const wholeScreens = [];
for (const [id, module] of Object.entries(data)) {
  for (const [step, screen] of Object.entries(module.screens)) {
    walk(screen, `${id.slice(0, 4)}:${step}`);
    if (screen.component) wholeScreens.push(`${screen.component} (${id} ${step})`);
  }
}
console.log(`DATA: ${MODULES.map((id) => `${id} ${Object.keys(data[id].screens).length}`).join(", ")} screens; ${nodes} component nodes; ${used.size} distinct kit names`);
const missing = [...used.keys()].filter((name) => !resolvable.has(name.slice(4)));
if (missing.length) problem(`the data names ${missing.length} component(s) the code no longer has: ${missing.join(", ")} (re-export that module on /kit/export)`);
else console.log("  every kit:* name in the data resolves to code");
const oneScreen = [...used].filter(([, screens]) => screens.size === 1).map(([name]) => name.slice(4));
console.log(`ON ONE SCREEN ONLY (${oneScreen.length}; the merge to-do list): ${oneScreen.join(", ")}`);
console.log(`WHOLE SCREENS still module-named (${wholeScreens.length}): ${wholeScreens.join(", ")}`);
const duplicates = [...used.keys()].filter((name) => /-(datatypes|operators|conditions|variable)$/.test(name));
console.log(`SAME NAME, DIFFERENT COMPONENT in the data (${duplicates.length}): ${duplicates.join(", ") || "none"}`);

// ---------- 2. Files the docs name that are gone ----------
const DOCS = ["AGENTS.md", "CLAUDE.md", "docs/kit-handoff.md", "docs/kit-components.md", "docs/kit.md"];
let gone = 0;
for (const doc of DOCS) {
  for (const m of read(doc).matchAll(/`((?:src|docs|scripts|public)\/[A-Za-z0-9_./\[\]-]+)`/g)) {
    const path = m[1].replace(/[.,)]+$/, "");
    if (path.endsWith("/") || path.includes("*")) continue;
    if (!existsSync(join(repo, path))) {
      gone += 1;
      problem(`${doc} names ${path}, which does not exist`);
    }
  }
}
if (!gone) console.log("DOCS: every file path they name exists");

// ---------- 3. Kit components kit.md names vs what the kit has ----------
const barrels = read("src/components/kit/index.ts") + read("src/components/kit/internal.ts");
const exported = new Set([...barrels.matchAll(/export \{([^}]+)\}/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/^type /, "").split(" as ").pop()).filter(Boolean)));
const exists = (name) => exported.has(name) || ["inputs", "options", "artboard", "feedback", "header", "buttons", "text", "hex", "layout", "media", "audio", "game", "reward"].some((dir) => existsSync(join(repo, `src/components/kit/${dir}/${name}.tsx`)));
// Not kit components: the runtime, the legacy runners, the module screens lists, and a few app-level names.
const NOT_KIT = new Set(["ModuleRunner", "ScreenRunner", "DataTypesScreen", "OperatorsScreen", "ConditionsScreen", "VariableQuizScreen", "QuizLook", "ItemsDrive", "WalletDrive", "SCREENS", "RiveAssetsGate", "Markup", "HexSays", "Props", "Json", "KitNode", "KIT", "LessonCard"]);
// The "Older names" paragraph lists the names that were renamed, on purpose.
const kitMd = read("docs/kit.md").split("\n").filter((line) => !line.startsWith("Older names")).join("\n");
const unknown = [...new Set([...kitMd.matchAll(/`([A-Z][A-Za-z]+)`/g)].map((m) => m[1]))].filter((name) => !exists(name) && !NOT_KIT.has(name));
if (unknown.length) problem(`docs/kit.md names kit component(s) that do not exist: ${unknown.join(", ")}`);
else console.log("KIT.MD: every component it names exists");

// ---------- 4. Facades written but not wired (the half-done list) ----------
const registered = read("src/components/kit/registry.ts");
const facades = ["SortGroups", "RevealCards", "OrderSteps", "MatchPairs", "BlockBuilder", "SwitchTable", "PredictRows"];
console.log("ACTIVITIES (file / in KIT registry / in index.ts):");
for (const name of facades) {
  const file = existsSync(join(repo, `src/components/kit/inputs/${name}.tsx`));
  console.log(`  ${name.padEnd(12)} ${file ? "file" : "MISSING"} / ${registered.includes(`${name},`) || registered.includes(`${name} `) ? "registered" : "not registered"} / ${read("src/components/kit/index.ts").includes(name) ? "exported" : "not exported"}`);
}

console.log(problems ? `\n${problems} problem(s).` : "\nAll good.");
process.exit(problems ? 1 : 0);
