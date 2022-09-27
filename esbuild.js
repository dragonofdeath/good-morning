import { build } from 'esbuild';
import { watch } from 'chokidar';
import fg from 'fast-glob';
import fse from 'fs-extra';
import postCSS from 'esbuild-postcss';

class Compiler {
    /** @private */
    constructor({ env }) {
        this.env = env;
    }

    /** @private */
    buildConfig() {
        return this.env === 'dev'
            ? {
                define: { 'process.env.NODE_ENV': '"development"' },
                minify: false,
                target: 'esnext'
            }
            : {
                define: { 'process.env.NODE_ENV': '"production"' },
                minify: true,
                target: 'es2020'
            }
    }

    /** @private */
    async copyStaticAssets() {
        for (const src of await fg(['./src/**/*'], { ignore: ['./src/**/*.{ts,tsx,css}'], onlyFiles: true })) {
            await fse.copy(src, src.replace(/^\.\/src\//, './dist/'))
        }
    }

    /** @private */
    async buildTailwind() {
        await build({
            entryPoints: ['./src/css/tailwind.css'],
            outfile: './dist/style.css',
            bundle: true,
            minify: false,
            external: ['*.svg'],
            logLevel: 'info',
            plugins: [postCSS()],
        });
    }

    /** @private */
    async buildTypeScript() {
        await build({
            entryPoints: ['./src/index.tsx'],
            bundle: true,
            outfile: './dist/index.js',
            platform: 'browser',
            format: 'iife',
            charset: 'utf8',
            logLevel: 'info',
            ...this.buildConfig()
        })
    }

    async build() {
        await fse.emptyDir('./dist')
        await Promise.all([
            this.copyStaticAssets(),
            this.buildTailwind(),
            this.buildTypeScript(),
        ])
    }

    async watch() {
        watch(['./src/**/*.*'], {
            persistent: true,
        }).on('all', async (event) => {
            if (event === 'change' || event === 'unlink') {
                await this.build();
            }
        })
    }
}

const [, , mode, env] = process.argv;
const compiler = new Compiler({ env: env });

await compiler.build();

if (mode === 'watch') {
    compiler.watch();
}
