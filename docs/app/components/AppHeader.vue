<script setup lang="ts">
const route = useRoute();
const links = computed(() => [
  {
    label: "Docs",
    to: "/docs/getting-started",
    icon: "i-lucide-book-open",
    active: route.path.startsWith("/docs"),
  },
]);
</script>

<template>
  <UHeader
    :ui="{
      left: 'min-w-0',
    }"
    class="flex flex-col"
  >
    <template #left>
      <AppHeaderLogo />
    </template>

    <UNavigationMenu :items="links" variant="link" />

    <template #right>
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton />
      </UTooltip>

      <UColorModeButton class="hidden sm:flex" />

      <UTooltip text="Open on GitHub" class="flex">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/nuxt-modules/i18n"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>

    <template #body>
      <UContentNavigation
        :navigation="$currentDocsVersionNavigation.value"
        highlight
        :ui="{ linkTrailingBadge: 'font-semibold uppercase' }"
      />
    </template>
  </UHeader>
</template>
