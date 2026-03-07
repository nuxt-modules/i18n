<script setup lang="ts">
const appConfig = useAppConfig();
const config = useRuntimeConfig();
const { hasLogo, headerLightUrl, headerDarkUrl, contextMenuItems } =
  useLogoAssets();

const versions = [
  { label: `v${config.public.version}`, version: 10, to: "/docs" },
  { label: "v9.5.3", version: 9, to: "https://v9.i18n.nuxtjs.org/docs" },
  {
    label: "v8.5.6",
    version: 8,
    to: "https://v9.i18n.nuxtjs.org/docs/v8/getting-started",
  },
  {
    label: "v7.3.1",
    version: 7,
    to: "https://v9.i18n.nuxtjs.org/docs/v7/setup",
  },
];

const items = versions.map((x) => {
  const isActive = x.version === 10;
  return {
    ...x,
    color: (isActive && ("primary" as const)) || undefined,
    active: isActive,
    checked: isActive,
    type: (isActive && ("checkbox" as const)) || undefined,
  };
});
</script>

<template>
  <div class="flex items-center gap-1.5">
    <UContextMenu v-if="hasLogo" :items="contextMenuItems">
      <NuxtLink to="/" class="flex items-center gap-2">

        <UColorModeImage
        :light="headerLightUrl"
        :dark="headerDarkUrl"
        :alt="appConfig.header?.logo?.alt || appConfig.header?.title"
        :class="['h-6 w-auto shrink-0', appConfig.header?.logo?.class]"
        />
      </NuxtLink>
    </UContextMenu>
    <span v-else>
      {{ appConfig.header?.title || "{appConfig.header.title}" }}
    </span>

    <UDropdownMenu
      v-slot="{ open }"
      :modal="false"
      :items="items"
      :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
      size="xs"
    >
      <UButton
        :label="`v${config.public.version}`"
        variant="subtle"
        trailing-icon="i-lucide-chevron-down"
        size="xs"
        class="font-semibold rounded-full truncate"
        :class="[open && 'bg-(--ui-primary)/15']"
        :ui="{
          trailingIcon: [
            'transition-transform duration-200',
            open ? 'rotate-180' : undefined,
          ]
            .filter(Boolean)
            .join(' '),
        }"
      />
    </UDropdownMenu>
  </div>
</template>
