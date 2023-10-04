<template>
  <h1 id="title" v-text="$t('Pages.Home.title')" />
  <p v-text="$t('Pages.Home.description')" />
  <p v-text="$t('Meta.locale')" />
  <NuxtLinkLocale id="locale" to="/about">{{ $t('Pages.About.title') }}</NuxtLinkLocale>
</template>
