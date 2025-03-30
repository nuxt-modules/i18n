<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <Title>Test</Title>
      <template v-for="link in head.link" :key="link.hid">
        <Link :id="link.hid" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.hid">
        <Meta :id="meta.hid" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body>
      <NuxtPage />
    </Body>
  </Html>
</template>

<script setup lang="ts">
const head = useLocaleHead()
</script>
