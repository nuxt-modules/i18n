<template>
  <div>
    <div id="current-page">page: {{ $t('about') }}</div>
    <a id="link-home" :href="localePath('index')">{{ $t('home') }}</a>
  </div>
</template>
