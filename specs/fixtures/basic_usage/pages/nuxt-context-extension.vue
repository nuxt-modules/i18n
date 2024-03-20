<template>
  <div>
    <p id="get-route-base-name">{{ $nuxt.$getRouteBaseName($route) }}</p>
    <p id="switch-locale-path">{{ $nuxt.$switchLocalePath('ja') }}</p>
    <p id="locale-path">{{ $nuxt.$localePath('nuxt-context-extension', 'nl') }}</p>
    <p id="locale-route">{{ $nuxt.$localeRoute($route) }}</p>
    <p id="locale-head">{{ $nuxt.$localeHead({}) }}</p>
  </div>
</template>
