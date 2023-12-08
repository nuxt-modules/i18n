<script lang="ts" setup>
import { useI18n, useSetI18nParams } from '#i18n'
import { useRoute } from '#imports'
const switchLocalePath = useSwitchLocalePath()
const { locale, locales } = useI18n()
const route = useRoute()

const setI18nParams = useSetI18nParams({ addDirAttribute: true, addSeoAttributes: true })
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
    <nav style="padding: 1em">
      <span v-for="locale in locales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
  </div>
</template>

<style>
.product {
  padding: 1em 0.5em;
}
</style>
