// Fallback Jest transformer used only when @swc/core's native binding cannot load
// (for example when Windows Smart App Control blocks the unsigned SWC payload).
// esbuild is already installed in the workspace through vite.
const { transformSync } = require("esbuild")

module.exports = {
  process(source, filename) {
    const result = transformSync(source, {
      loader: filename.endsWith(".ts") ? "ts" : "js",
      format: "cjs",
      target: "node22",
      sourcemap: "inline",
      sourcefile: filename,
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    })
    return { code: result.code }
  },
}
