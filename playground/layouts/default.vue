<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({ addSeoAttributes: true })
const title = computed(() => t('layouts.title', { title: t(route.meta.title ?? 'TBD') }))
</script>

<template>
  <div>
    <Html :lang="head.htmlAttrs.lang">
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
        <slot />
        <div>
          <h2>I18n Head</h2>
          <code>{{ head }}</code>
        </div>
      </Body>
    </Html>
  </div>
</template>
