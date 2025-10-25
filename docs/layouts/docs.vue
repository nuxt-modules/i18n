<script setup lang="ts">
const { $currentDocsVersionNavigation } = useNuxtApp()
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation
              :navigation="$currentDocsVersionNavigation"
              highlight
              :ui="{ linkTrailingBadge: 'font-semibold uppercase' }"
            />
          </UPageAside>
        </template>

        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
