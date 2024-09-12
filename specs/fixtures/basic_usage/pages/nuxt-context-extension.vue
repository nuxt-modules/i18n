<script setup></script>

<template>
  <div>
    <p id="get-route-base-name">{{ $nuxt.$getRouteBaseName($route) }}</p>
    <p id="switch-locale-path">{{ $nuxt.$switchLocalePath('ja') }}</p>
    <p id="locale-path">{{ $nuxt.$localePath('nuxt-context-extension', 'nl') }}</p>
    <p id="locale-route">{{ JSON.stringify($nuxt.$localeRoute()) }}</p>
    <p id="locale-head">{{ $nuxt.$localeHead({ addLangAttribute: true }) }}</p>
  </div>
</template>
