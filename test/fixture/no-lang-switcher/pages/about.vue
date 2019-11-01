<template>
  <div>
    <div id="current-page">page: {{ $t('about') }}</div>
    <nuxt-link id="link-home" exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
  </div>
</template>
