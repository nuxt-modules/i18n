<script setup lang="ts">
const appConfig = useAppConfig();
</script>

<template>
  <div class="hidden lg:block space-y-6">
    <Ads />

    <USeparator v-if="appConfig.toc?.bottom?.links?.length" type="dashed" />

    <UPageLinks
      v-if="appConfig.toc?.bottom?.links?.length"
      :title="appConfig.toc?.bottom?.title"
      :links="appConfig.toc?.bottom?.links"
    />
  </div>
</template>
