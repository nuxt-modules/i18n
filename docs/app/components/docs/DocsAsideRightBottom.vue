<script setup lang="ts">
const route = useRoute();

const pageUrl = route.path;
const appConfig = useAppConfig();
const { t } = useDocusI18n();
const { data } = await useAsyncData(pageUrl, () =>
  queryCollection("docs").path(pageUrl).first(),
);

const links = computed(() =>
  [
    appConfig?.toc?.bottom?.edit && {
      icon: "i-heroicons-pencil-square",
      label: "Edit this page",
      to: `${appConfig.toc.bottom.edit}/${data?.value?.stem}.${data.value?.extension}`,
      target: "_blank",
    },
    {
      icon: "i-lucide-star",
      label: "Star on GitHub",
      to: `https://github.com/nuxt-modules/i18n`,
      target: "_blank",
    },
    // TODO:
    // {
    //   icon: 'i-lucide-life-buoy',
    //   label: 'Contribution',
    //   to: '/getting-started/contribution'
    // }
  ].filter(Boolean),
);
</script>

<template>
  <div
    v-if="appConfig.toc?.bottom?.links?.length"
    class="hidden lg:block space-y-6"
  >
    <Ads />

    <USeparator type="dashed" />

    <UPageLinks
      v-if="appConfig.toc?.bottom?.links?.length"
      :title="appConfig.toc?.bottom?.title || t('docs.links')"
      :links="links"
    />

    <USeparator v-if="appConfig.toc?.bottom?.links?.length" type="dashed" />
  </div>
</template>
