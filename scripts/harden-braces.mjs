// Temporary mitigation for GHSA-vfj7-8cjw-p6xm (no upstream patched release).
// npm audit still reports the upstream version; do not treat this as a version fix.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const roots = new Set();
for (const dependency of ["braces", "micromatch", "chokidar"]) {
  try {
    const location = require.resolve(dependency);
    const localRequire = createRequire(location);
    roots.add(path.dirname(localRequire.resolve("braces/package.json")));
  } catch (error) { if (error.code !== "MODULE_NOT_FOUND") throw error; }
}
const guard = "\"use strict\";\nmodule.exports = (input) => {\n  if (typeof input === \"string\") {\n    let depth = 0;\n    for (let i = 0; i < input.length; i++) {\n      if (input.charCodeAt(i) === 92) { i++; continue; }\n      if (input[i] === \"{\" || input[i] === \"(\") {\n        if (++depth > 64) throw new SyntaxError(\"Brace pattern nesting exceeds the safe limit\");\n      } else if (input[i] === \"}\" || input[i] === \")\") depth = Math.max(0, depth - 1);\n    }\n    return;\n  }\n  const pending = [{ node: input, depth: 0 }];\n  const seen = new WeakSet();\n  let count = 0;\n  while (pending.length) {\n    const { node, depth } = pending.pop();\n    if (!node || typeof node !== \"object\") continue;\n    if (depth > 64 || ++count > 65536 || seen.has(node)) throw new SyntaxError(\"Brace AST exceeds the safe limit\");\n    seen.add(node);\n    if (Array.isArray(node.nodes)) for (const child of node.nodes) pending.push({ node: child, depth: depth + 1 });\n  }\n};\n";
for (const root of roots) {
  const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
  if (version !== "3.0.3") throw new Error("Review the braces mitigation for installed version " + version);
  fs.writeFileSync(path.join(root, "lib", "depth-guard.js"), guard);
  for (const file of ["parse", "compile", "expand", "stringify"]) {
    const target = path.join(root, "lib", file + ".js");
    let source = fs.readFileSync(target, "utf8");
    if (source.includes("require('./depth-guard')")) continue;
    const marker = file === "parse" ? "const parse = (input, options = {}) => {" :
      file === "stringify" ? "module.exports = (ast, options = {}) => {" : "const " + file + " = (ast, options = {}) => {";
    if (!source.includes(marker)) throw new Error("Unsupported braces source layout: " + target);
    source = source.replace(marker, () => marker + "\n  require('./depth-guard')(" + (file === "parse" ? "input" : "ast") + ");");
    fs.writeFileSync(target, source);
  }
}
console.log("Applied braces nesting limits to " + roots.size + " installed package(s).");
