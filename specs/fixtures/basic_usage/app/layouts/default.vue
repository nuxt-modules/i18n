<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useHead } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'
import { useRuntimeConfig } from 'nuxt/app'

const route = useRoute()
const { t } = useI18n()
const strictSeo = useRuntimeConfig().public.i18n.experimental.strictSeo
const head = !strictSeo && useLocaleHead({ seo: { canonicalQueries: ['page', 'canonical'] } })
const title = computed(() => `Page - ${t(route.meta?.title ?? '')}`)
</script>

<template>
  <Html :lang="(!strictSeo && head.htmlAttrs.lang) || undefined" :dir="(!strictSeo && head.htmlAttrs.dir) || undefined">
    <Head v-if="!strictSeo">
      <Title>{{ title }}</Title>
      <template v-for="link in head.link" :key="link.id">
        <Link :id="link.id" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.id">
        <Meta :id="meta.id" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body>
      <slot />
      <section v-if="!strictSeo">
        <code id="layout-use-locale-head">{{ head }}</code>
      </section>
    </Body>
  </Html>
</template>
