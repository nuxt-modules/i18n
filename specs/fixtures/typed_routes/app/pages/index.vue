<template>
  <div>
    index
    <NuxtLinkLocale :to="{ name: 'about' }">about</NuxtLinkLocale>
    <NuxtLinkLocale :to="{ name: 'slug', params: { slug: 'ok' } }">slug</NuxtLinkLocale>
    <NuxtLinkLocale :to="{ path: '/anything' }" locale="nl">path</NuxtLinkLocale>
    <NuxtLinkLocale to="about">name string</NuxtLinkLocale>
    <!-- @vue-expect-error invalid route name -->
    <NuxtLinkLocale :to="{ name: 'nope' }">invalid</NuxtLinkLocale>
  </div>
</template>
