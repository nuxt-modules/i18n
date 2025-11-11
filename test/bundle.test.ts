// adapted from https://github.com/nuxt/image/blob/5415ba721e8cb1ec15205f9bf54ada2e3d5fe07d/test/unit/bundle.test.ts
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fsp } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { buildNuxt, loadNuxt } from "@nuxt/kit";
import type { NuxtConfig } from "@nuxt/schema";
import { describe, it, expect } from "vitest";
import { glob } from "tinyglobby";
import { isWindows } from "std-env";

describe.skipIf(process.env.ECOSYSTEM_CI || isWindows)(
  "nuxt i18n bundle size",
  () => {
    it("should match snapshot", { timeout: 120_000 }, async () => {
      const rootDir = fileURLToPath(new URL("../.tmp", import.meta.url));
      await fsp.rm(rootDir, { recursive: true, force: true });

      const [withoutModule, withModule, withVueI18n] = await Promise.all([
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
      ]);

      // total bundle size increase
      expect(
        roundToKilobytes(withModule.totalBytes - withoutModule.totalBytes),
      ).toMatchInlineSnapshot(`"69.4k"`);

      // vue-i18n bundle size (without nuxt-i18n)
      expect(
        roundToKilobytes(withVueI18n.totalBytes - withoutModule.totalBytes),
      ).toMatchInlineSnapshot(`"43.3k"`);

      // nuxt-i18n overhead
      expect(
        roundToKilobytes(withModule.totalBytes - withVueI18n.totalBytes),
      ).toMatchInlineSnapshot(`"26.0k"`);
    });
  },
);

async function build(
  rootDir: string,
  config: NuxtConfig = {},
  options: { vueI18n?: boolean } = {},
) {
  await mkdir(rootDir, { recursive: true });
  // await mkdir(join(rootDir, "/i18n/locales"), { recursive: true });
  // await writeFile(
  //   join(rootDir, "/i18n/locales/en.json"),
  //   `{ "hello": "Hello" }`,
  // );
  // await writeFile(
  //   join(rootDir, "/i18n/locales/fr.json"),
  //   `{ "hello": "Bonjour" }`,
  // );
  // await mkdir(join(rootDir, "/pages"), { recursive: true });
  // await writeFile(
  //   join(rootDir, "/pages/index.vue"),
  //   `<template>{{ $t('hello') }}</template>`,
  // );
  await writeFile(
    join(rootDir, "app.vue"),
    // `<template><NuxtPage /></template>`,
    options.vueI18n
      ? `<script setup lang="ts">
      import { useI18n } from 'vue-i18n'
      const { t } = useI18n()
      </script>\n`
      : `` + `<template><div>Hello world</div></template>`,
  );
  const nuxt = await loadNuxt({
    cwd: rootDir,
    ready: true,
    overrides: {
      ssr: false,
      ...config,
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
    const isSymlink = (
      await fsp.lstat(path).catch(() => null)
    )?.isSymbolicLink();

    if (!isSymlink) {
      const bytes = Buffer.byteLength(await fsp.readFile(path));
      totalBytes += bytes;
    }
  }
  return { files, totalBytes };
}

function roundToKilobytes(bytes: number) {
  return (bytes / 1024).toFixed(bytes > 100 * 1024 ? 0 : 1) + "k";
}
