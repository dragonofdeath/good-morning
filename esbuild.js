import { build, context } from "esbuild";
import { watch } from "chokidar";
import fg from "fast-glob";
import fse from "fs-extra";
import postCSS from "esbuild-postcss";

class Compiler {
  /** @private */
  constructor({ env }) {
    this.env = env;
  }

  /** @private */
  buildConfig() {
    return this.env === "dev"
      ? {
          define: { "process.env.NODE_ENV": '"development"' },
          minify: false,
          sourcemap: true,
          target: "esnext",
        }
      : {
          define: { "process.env.NODE_ENV": '"production"' },
          minify: true,
          sourcemap: false,
          target: "es2020",
        };
  }

  /** @private */
  async copyStaticAssets() {
    for (const src of await fg(["./src/**/*"], {
      ignore: ["./src/**/*.{ts,tsx,css}"],
      onlyFiles: true,
    })) {
      await fse.copy(src, src.replace(/^\.\/src\//, "./dist/"));
    }
  }

  /** @private */
  async buildTailwind() {
    await build({
      entryPoints: ["./src/css/globals.css"],
      outfile: "./dist/style.css",
      bundle: true,
      minify: true,
      external: ["*.svg"],
      logLevel: "info",
      plugins: [postCSS()],
    });
  }

  async buildTypeScript() {
    await build({
      entryPoints: ["./src/index.tsx"],
      bundle: true,
      splitting: true,
      outdir: "./dist/",
      platform: "browser",
      format: "esm",
      charset: "utf8",
      logLevel: "info",
      ...this.buildConfig(),
    });
  }

  async build() {
    await fse.emptyDir("./dist");
    await Promise.all([
      this.copyStaticAssets(),
      this.buildTailwind(),
      this.buildTypeScript(),
    ]);
  }

  async watch() {
    watch(["./src/**/*.*"], {
      persistent: true,
    }).on("all", async (event) => {
      if (event === "change" || event === "unlink") {
        await this.build();
      }
    });
  }

  async serve() {
    const ctxComponents = await context(["./src/**/*.*"], {
      persistent: true,
    });

    ctxComponents.watch();
    ctxApps.serve({ port: 50111, servedir: "build" });
  }
}

const [, , mode, env] = process.argv;
const compiler = new Compiler({ env: env });

await compiler.build();

if (mode === "watch") {
  compiler.watch();
}

if (mode === "serve") {
  compiler.serve();
}
