<script lang="ts" setup>
import { useFetch } from '#imports'

const { locale } = useI18n()
const localePath = useLocalePath()
const { data } = await useFetch('/api/products')
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
      <li v-for="product in data" :key="product.id">
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
