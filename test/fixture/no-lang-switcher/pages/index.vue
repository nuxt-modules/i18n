<template>
  <div>
    <div id="current-page">page: {{ $t('home') }}</div>
    <nuxt-link id="link-about" exact :to="localePath('about')">{{ $t('about') }}</nuxt-link>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
  </div>
</template>
