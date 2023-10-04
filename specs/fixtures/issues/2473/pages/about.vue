<template>
  <h1 id="title" v-text="$t('Pages.About.title')" />
  <p v-text="$t('Pages.About.description')" />
  <p v-text="$t('Meta.locale')" />
  <NuxtLinkLocale id="locale" to="/">{{ $t('Pages.Home.title') }}</NuxtLinkLocale>
</template>
