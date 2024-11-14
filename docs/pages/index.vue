<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

// Page Metadata (SEO & OG)
const { setPageMeta } = usePageMeta()
setPageMeta({
  title: page.value.title,
  description: page.value.description,
  headline: page.value.hero.headline?.label
})
const source = ref('npx nuxi module add i18n')
const { copy, copied } = useClipboard({ source })
</script>

<template>
  <div>
    <ULandingHero
      v-if="page.hero"
      v-bind="page.hero"
      :ui="{
        container: 'overflow-hidden py-10 flex flex-row items-center  gap-1',
        links: 'flex items-center gap-2',
        description: 'text-gray-500 dark:text-gray-400 text-xl max-w-2xl leading-normal mb-10'
      }"
    >
      <template #headline>
        <UBadge v-if="page.hero.headline" variant="subtle" size="lg" class="relative rounded-full font-semibold">
          <NuxtLink :to="page.hero.headline.to" target="_blank" class="focus:outline-none" tabindex="-1">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>

          {{ page.hero.headline?.label }}

          <UIcon
            v-if="page.hero.headline.icon"
            :name="page.hero.headline.icon"
            class="ml-1 w-4 h-4 pointer-events-none"
          />
        </UBadge>
      </template>

      <template #description>
        {{ page.hero.description }}
      </template>

      <template #title>
        <p>
          <span class="md:hidden">i18n</span>
          <span class="hidden md:block">Internationalization</span>
          for
          <span class="text-primary">Nuxt Applications</span>
        </p>
      </template>

      <UInput
        aria-label="Copy code to get started"
        :model-value="source"
        name="get-started"
        class="mx-auto"
        disabled
        autocomplete="off"
        size="lg"
        :ui="{ base: 'w-[300px] disabled:cursor-default', icon: { trailing: { pointer: '' } } }"
      >
        <template #leading>
          <UIcon name="i-ph-terminal" />
        </template>
        <template #trailing>
          <UButton
            aria-label="Copy Code"
            :color="copied ? 'green' : 'gray'"
            variant="ghost"
            :padded="false"
            :icon="copied ? 'i-ph-check' : 'i-ph-copy'"
            @click="copy(source)"
          />
        </template>
      </UInput>
    </ULandingHero>

    <ULandingSection :title="page.features.title">
      <UPageGrid>
        <ULandingCard v-for="(item, index) of page.features.items" :key="index" v-bind="item" />
      </UPageGrid>
    </ULandingSection>
  </div>
</template>
