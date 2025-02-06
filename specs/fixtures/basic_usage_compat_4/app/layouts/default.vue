<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({ key: 'id', seo: { canonicalQueries: ['page', 'canonical'] } })
const title = computed(() => `Page - ${t(route.meta?.title ?? '')}`)
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
      <slot />
      <section>
        <code id="layout-use-locale-head">{{ head }}</code>
      </section>
    </Body>
  </Html>
</template>
