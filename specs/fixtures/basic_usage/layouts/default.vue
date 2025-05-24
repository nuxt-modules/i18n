<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useHead } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'
import { useRuntimeConfig } from 'nuxt/app'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({ seo: { canonicalQueries: ['page', 'canonical'] } })
const title = computed(() => `Page - ${t(route.meta?.title ?? '')}`)
const strictSEO = useRuntimeConfig().public.i18n.experimental.strictSEO
</script>

<template>
  <Html :lang="(!strictSEO && head.htmlAttrs.lang) || undefined" :dir="(!strictSEO && head.htmlAttrs.dir) || undefined">
    <Head v-if="!strictSEO">
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
      <section v-if="!strictSEO">
        <code id="layout-use-locale-head">{{ head }}</code>
      </section>
    </Body>
  </Html>
</template>
