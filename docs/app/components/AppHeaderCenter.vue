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
  <UNavigationMenu
    :ui="{
      root: 'flex items-center justify-center',
    }"
    :items="links"
    variant="link"
  />
</template>
