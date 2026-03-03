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

    <!-- <UNavigationMenu :items="links" variant="link" /> -->

    <template #right>
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton />
      </UTooltip>

      <UTooltip text="Open on GitHub" class="hidden lg:flex">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/nuxt/ui"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>

    <template #body>
      <HeaderBody />
    </template>
  </UHeader>
</template>
