<script setup lang="ts">
import { useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead()
const title = computed(() => t('layouts.title', { title: t(String(route.meta.title ?? 'TBD')) }))
</script>

<template>
  <div>
    <Html :lang="head.htmlAttrs!.lang">
      <Head>
        <Title>{{ title }}</Title>
        <template v-for="link in head.link" :key="link.hid">
          <Link :id="link.hid" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
        </template>
        <template v-for="meta in head.meta" :key="meta.hid">
          <Meta :id="meta.hid" :property="meta.property" :content="meta.content" />
        </template>
      </Head>

      <Body>
        <slot />

        <section>
          <h3>Head</h3>
          <details>
            <summary>Show head tags</summary>
            <pre>{{ head }}</pre>
          </details>
        </section>
      </Body>
    </Html>
  </div>
</template>
