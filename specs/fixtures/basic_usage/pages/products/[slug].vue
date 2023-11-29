<script lang="ts" setup>
import { useI18n, useLocalePath, useSetI18nParams } from '#i18n'
import { ref, computed, onMounted, useHead, useRoute } from '#imports'
import LangSwitcher from '@/components/LangSwitcher.vue'
const product = ref()
const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const head = useHead({})

const setI18nParams = useSetI18nParams({ addSeoAttributes: true })
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
    <LangSwitcher />
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
