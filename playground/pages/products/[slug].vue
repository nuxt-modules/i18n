<script lang="ts" setup>
import { useI18n, useLocalePath, useSetI18nParams, useSwitchLocalePath } from '#i18n'
import { ref, computed, onMounted, useHead, useRoute } from '#imports'
// import LangSwitcher from '@/components/LangSwitcher.vue'
const product = ref()
const { locale, locales } = useI18n()
const route = useRoute()

const setI18nParams = useSetI18nParams()
const { data, pending } = await useAsyncData(`products-${route.params.slug}`, () =>
  $fetch(`/api/products/${route.params.slug}`)
)

if (data.value != null) {
  const availableLocales = Object.keys(data.value.slugs)
  const slugs: Record<string, string> = {}

  for (const l of availableLocales) {
    slugs[l] = { slug: data.value.slugs[l] }
  }

  setI18nParams(slugs)
}
</script>

<template>
  <div>
    <section class="product">{{ pending ? 'loading' : data?.name?.[locale] }}</section>
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
