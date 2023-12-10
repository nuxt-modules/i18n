<script lang="ts" setup>
const { locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const { data } = await useAsyncData('products', () => $fetch(`/api/products`))
definePageMeta({
  pageTransition: {
    name: 'page',
    duration: 0,
    mode: 'default',
    onBeforeEnter: async () => {
      const { finalizePendingLocaleChange } = useNuxtApp().$i18n
      await finalizePendingLocaleChange()
    }
  }
})
</script>

<template>
  <div>
    <nav style="padding: 1em">
      <span v-for="locale in locales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
    <NuxtLink
      class="product"
      v-for="product in data"
      :key="product.id"
      :to="localePath({ name: 'products-slug', params: { slug: product?.slugs?.[locale] ?? 'none' } })"
    >
      {{ product.name?.[locale] }}
    </NuxtLink>
    <NuxtPage />
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
