<template>
  <div>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
    <nuxt-link
      id="unprocessed-url"
      :to="localePath(unprocessedUrl.to)"
    >{{ $t(unprocessedUrl.text) }}</nuxt-link>
    <nuxt-link
      id="processed-url"
      :to="processedUrl.to"
    >{{ processedUrl.text }}</nuxt-link>
    <div id="route-base-name">
      {{ getRouteBaseName() }}
    </div>
  </div>
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'
export default defineComponent({
  setup () {
    const { app: { i18n, localePath } } = useContext()

    const unprocessedUrl = {
      text: 'home',
      to: 'index'
    }

    const processedUrl = {
      text: i18n.t('home'),
      to: localePath('index')
    }

    return { unprocessedUrl, processedUrl }
  }
})
</script>
