<template>
  <div>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
    <nuxt-link
      id="unprocessed-url"
      :to="localePath(unprocessedUrl.to)"
      v-text="$t(unprocessedUrl.text)"
    />
    <nuxt-link
      id="processed-url"
      :to="processedUrl.to"
      v-text="processedUrl.text"
    />
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
