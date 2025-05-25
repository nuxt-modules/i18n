<script lang="ts" setup>
import { useI18n, useSetI18nParams } from '#i18n'
import { useRoute, useFetch } from '#imports'

const { locale } = useI18n()
const route = useRoute()

const setI18nParams = useSetI18nParams({ canonicalQueries: ['canonical'] })
const { data } = await useFetch(() => `/api/products/${route.params.slug}`)
const slugs = {}
if (data.value != null) {
  for (const k in data.value.slugs) {
    slugs[k] = { slug: data.value.slugs[k] }
  }
  setI18nParams(slugs)
}
</script>

<template>
  <div>
    <section class="product">{{ data?.name?.[locale] }}</section>
  </div>
</template>
