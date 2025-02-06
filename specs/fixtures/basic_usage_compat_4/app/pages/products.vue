<script lang="ts" setup>
import { ref } from '#imports'
import LangSwitcher from '../components/LangSwitcher.vue'

const products = ref([])
const { locale } = useI18n()
const localePath = useLocalePath()

onMounted(async () => {
  products.value = await $fetch(`/api/products`)
})
</script>

<template>
  <div>
    <LangSwitcher />
    <ul>
      <li>
        <NuxtLink id="params-add-query" :to="localePath({ query: { test: '123', canonical: '123' } })"
          >Add query</NuxtLink
        >
      </li>
      <li>
        <NuxtLink id="params-remove-query" :to="localePath({ query: undefined })">Remove query</NuxtLink>
      </li>
    </ul>
    <ul>
      <li v-for="product in products" :key="product.id">
        <NuxtLink
          class="product"
          :to="localePath({ name: 'products-slug', params: { slug: product?.slugs?.[locale] ?? 'none' } })"
          >{{ product.name?.[locale] }}
        </NuxtLink>
      </li>
    </ul>
    <NuxtPage />
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
