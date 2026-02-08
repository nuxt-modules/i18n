// adapted from https://github.com/nuxt/image/blob/5415ba721e8cb1ec15205f9bf54ada2e3d5fe07d/test/unit/bundle.test.ts
// import process from "node:process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile, rm, lstat, readFile } from "node:fs/promises";
import { buildNuxt, loadNuxt } from "@nuxt/kit";
import type { NuxtConfig } from "@nuxt/schema";
import { describe, it, expect } from "vitest";
import { glob } from "tinyglobby";
// import { isWindows } from "std-env";
import { defu } from "defu";

// describe.skipIf(process.env.ECOSYSTEM_CI || isWindows)(
// flaky package resolution
describe.skip(
  "nuxt i18n bundle size",
  () => {
    it("should match snapshot", { timeout: 120_000 }, async () => {
      const rootDir = fileURLToPath(new URL("../.tmp", import.meta.url));

      await rm(rootDir, { recursive: true, force: true }).catch(() => null);

      const [base, withModule, withVueI18n, withVueI18nDropCompiler] =
        await Promise.all([
          build(join(rootDir, "without")),
          build(join(rootDir, "with"), {
            modules: ["@nuxtjs/i18n"],
            // i18n: {
            //   defaultLocale: "en",
            //   locales: [
            //     { code: "en", file: "en.json" },
            //     { code: "fr", file: "fr.json" },
            //   ],
            // },
          }),
          build(join(rootDir, "vue-i18n"), {}, { vueI18n: true }),
          build(
            join(rootDir, "vue-i18n-drop-compiler"),
            {
              vite: {
                define: {
                  __INTLIFY_JIT_COMPILATION__: true,
                  __INTLIFY_DROP_MESSAGE_COMPILER__: true,
                },
              },
            },
            { vueI18n: true },
          ),
        ]);

      const data = {
        // total bundle size increase
        module: roundToKilobytes(withModule.totalBytes - base.totalBytes),
        "module (without vue-i18n)": roundToKilobytes(withModule.totalBytes - withVueI18n.totalBytes),
        "vue-i18n": roundToKilobytes(withVueI18n.totalBytes - base.totalBytes),
        "vue-i18n (without message compiler)": roundToKilobytes(withVueI18nDropCompiler.totalBytes - base.totalBytes),
      };

      expect(data).toMatchInlineSnapshot(`
        {
          "module": "69.0k",
          "module (without vue-i18n)": "26.0k",
          "vue-i18n": "43.0k",
          "vue-i18n (without message compiler)": "26.4k",
        }
      `);
    });
  },
);

async function build(
  rootDir: string,
  config: NuxtConfig = {},
  options: { vueI18n?: boolean } = {},
) {
  await mkdir(rootDir, { recursive: true });

  const tree: Record<string, string> = {
    // "/i18n/locales/en.json": `{ "hello": "Hello" }`,
    // "/i18n/locales/fr.json": `{ "hello": "Bonjour" }`,
    // "/pages/index.vue": `<template>{{ $t('hello') }}</template>`,
    "/app.vue": `<template><NuxtPage /></template>`,
  };

  if (options.vueI18n) {
    const template = [
      `<script setup lang="ts">`,
      `import { useI18n } from 'vue-i18n'`,
      `const { t } = useI18n()`,
      `</script>`,
      `<template><div>{{ t('hello') }}</div></template>`,
    ].join("\n");

    if (tree["/pages/index.vue"]) {
      tree["/pages/index.vue"] = template;
    } else {
      tree["/app.vue"] = template;
    }
  }

  for (const [path, content] of Object.entries(tree)) {
    const fullPath = join(rootDir, path);
    const dir = join(fullPath, "..");
    if (dir !== rootDir) {
      await mkdir(join(fullPath, ".."), { recursive: true });
    }
    await writeFile(fullPath, content);
  }

  const nuxt = await loadNuxt({
    cwd: rootDir,
    ready: true,
    overrides: {
      // ssr: false,
      ...defu(config, {
        vite: {
          define: {
            __INTLIFY_PROD_DEVTOOLS__: false, // for vue-i18n build - disabled in nuxt-i18n bundler.ts
          },
          // to disable minification for easier size analysis
          // $client: {
          //   build: {
          //     minify: false,
          //     rollupOptions: {
          //       output: {
          //         chunkFileNames: "_nuxt/[name].js",
          //         entryFileNames: "_nuxt/[name].js",
          //       },
          //     },
          //   },
          // },
        },
      }),
    },
  });
  await buildNuxt(nuxt);
  await nuxt.close();
  return await analyzeSizes(["**/*.js"], join(rootDir, ".output/public"));
}

async function analyzeSizes(pattern: string[], rootDir: string) {
  const files: string[] = await glob(pattern, { cwd: rootDir });
  let totalBytes = 0;
  for (const file of files) {
    const path = join(rootDir, file);
    const isSymlink = (await lstat(path).catch(() => null))?.isSymbolicLink();

    if (!isSymlink) {
      const bytes = Buffer.byteLength(await readFile(path));
      totalBytes += bytes;
    }
  }
  return { files, totalBytes };
}

function roundToKilobytes(bytes: number) {
  return (bytes / 1024).toFixed(bytes > 100 * 1024 ? 0 : 1) + "k";
}
