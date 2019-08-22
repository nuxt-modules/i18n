<template>
<div>
  {{ $t('about') }}
  <nuxt-link exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
</div>
</template>
