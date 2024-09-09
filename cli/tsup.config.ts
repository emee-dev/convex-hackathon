import { defineConfig } from "tsup";
import { readFile } from "fs/promises";
import { Plugin } from "esbuild";

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
  throw new Error("Environment variable [FRONTEND_URL] was not specified.");
}

const replace = (replacementMap: Record<string, string>): Plugin => {
  return {
    name: "replace-plugin",
    setup(build) {
      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
        let source = await readFile(args.path, "utf8");

        for (const [searchValue, replaceValue] of Object.entries(
          replacementMap
        )) {
          const regex = new RegExp(searchValue, "g");
          source = source.replace(regex, replaceValue);
        }

        return {
          contents: source,
          loader:
            args.path.endsWith(".ts") || args.path.endsWith(".tsx")
              ? "ts"
              : "js",
        };
      });
    },
  };
};

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  esbuildPlugins: [
    replace({
      "process.env.FRONTEND_URL": `'${FRONTEND_URL}'`,
    }),
  ],
});
