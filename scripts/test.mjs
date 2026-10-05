import ts from "typescript";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
const directory = ".npm-cache/test-build";
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "package.json"), JSON.stringify({ type: "module" }));
const files = [
  "tests/security.test.ts", "src/lib/payments.ts", "src/lib/checkout.ts",
  "src/lib/session-validation.ts", "src/lib/admin-validations.ts", "src/lib/validations.ts", "src/lib/license-categories.ts",
];
for (const file of files) {
  const result = ts.transpileModule(await readFile(file, "utf8"), {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const output = path.join(directory, file.replace(/\.ts$/, ".js"));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, result.outputText.replace(/(from\s+["'])(\.[^"']+)(["'])/g, (match, prefix, specifier, suffix) => /\.[a-z]+$/i.test(specifier) ? match : `${prefix}${specifier}.js${suffix}`));
}
const result = spawnSync(process.execPath, ["--test", path.join(directory, "tests/security.test.js"), "tests/workflows.test.mjs"], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;