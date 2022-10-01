<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({ addDirAttribute: true, addSeoAttributes: { canonicalQueries: ['page'] } })
const title = computed(() => `Page - ${t(route.meta.title as string)}`)
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="(link, index) in head.link" :key="index">
        <Link :hid="link.hid" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="(meta, index) in head.meta" :key="index">
        <Meta :hid="meta.hid" :property="meta.property" :content="meta.content" />
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
