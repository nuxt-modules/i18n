<script lang="ts" setup>
import { ref } from '#imports'

const products = ref([])
const { locale } = useI18n()
const localePath = useLocalePath()

onMounted(async () => {
  products.value = await $fetch(`/api/products`)
})
</script>

<template>
  <div>
    <NuxtLink
      class="product"
      v-for="product in products"
      :key="product.id"
      :to="localePath({ name: 'products-slug', params: { slug: product?.slugs?.[locale] ?? 'none' } })"
      >{{ product.name?.[locale] }}
    </NuxtLink>
    <NuxtPage />
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
