import { mkdir } from "node:fs/promises";
import path from "node:path";
import { compile } from "ripple/compiler";

const appPath = path.resolve("src/App.ripple");
const compiledJs = path.resolve("src/App.compiled.js");
const compiledCss = path.resolve("src/App.compiled.css");
const publicDir = path.resolve("public");
const stylesInput = path.resolve("src/styles.css");
const stylesOutput = path.resolve("public/styles.css");

await mkdir(path.dirname(compiledJs), { recursive: true });
await mkdir(publicDir, { recursive: true });

await Bun.$`bunx tailwindcss -i ${stylesInput} -o ${stylesOutput}`;

const source = await Bun.file(appPath).text();
const result = await compile(source, appPath, { mode: "client" });

let js = result.js.code;
if (result.css && result.css.trim().length > 0) {
  await Bun.write(compiledCss, result.css);
  js += "\nimport \"./App.compiled.css\";\n";
}

await Bun.write(compiledJs, js);

const buildResult = await Bun.build({
  entrypoints: [path.resolve("src/main.ts")],
  outdir: publicDir,
  target: "browser",
  sourcemap: "external",
});

if (!buildResult.success) {
  console.error(buildResult.logs);
  process.exit(1);
}
