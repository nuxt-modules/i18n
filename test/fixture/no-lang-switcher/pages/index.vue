<template>
<div>
  {{ $t('home') }}
  <nuxt-link exact :to="localePath('about')">{{ $t('about') }}</nuxt-link>
  <div>locale: {{ $i18n.locale }}</div>
</div>
</template>
