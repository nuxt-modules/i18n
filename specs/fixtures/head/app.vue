<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: { canonicalQueries: ['page'] }
})
const title = computed(() => `Page - ${t(route.meta.title as string)}`)
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="link in head.link" :key="link.id">
        <Link :id="link.id" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.id">
        <Meta :id="meta.id" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body>
      <NuxtPage />
      <section style="display: none">
        <code id="home-use-locale-head">{{ head }}</code>
      </section>
    </Body>
  </Html>
</template>

<style>
section {
  margin: 1rem 0;
}
</style>
