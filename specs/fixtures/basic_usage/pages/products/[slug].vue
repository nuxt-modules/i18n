<script lang="ts" setup>
import { useI18n, useSetI18nParams } from '#i18n'
import { ref, useRoute } from '#imports'

const product = ref()
const { locale } = useI18n()
const route = useRoute()

const setI18nParams = useSetI18nParams()
product.value = await $fetch(`/api/products/${route.params.slug}`)
if (product.value != null) {
  const availableLocales = Object.keys(product.value.slugs)
  const slugs: Record<string, string> = {}

  for (const l of availableLocales) {
    slugs[l] = { slug: product.value.slugs[l] }
  }

  setI18nParams(slugs)
}
</script>

<template>
  <div>
    <section class="product">{{ product?.name?.[locale] }}</section>
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
