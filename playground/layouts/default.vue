<script setup lang="ts">
import { useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({ addLangAttribute: true, addDirAttribute: true, addSeoAttributes: true })
const title = computed(() => t('layouts.title', { title: t(route.meta.title ?? 'TBD') }))
</script>

<template>
  <div>
    <Html :lang="head.htmlAttrs.lang">
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
        <div>
          <h2>I18n Head</h2>
          <pre>{{ head }}</pre>
        </div>
      </Body>
    </Html>
  </div>
</template>
