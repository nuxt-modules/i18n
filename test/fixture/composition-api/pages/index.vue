<template>
  <div>
    <div id="current-locale">locale: {{ locale }}</div>
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
    <div>Other locales:
      <button v-for="l in $i18n.localeCodes" :key="l" @click="locale = l">{{ l }}</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'
import { useI18n } from '../../../../composition-api'

export default defineComponent({
  setup () {
    const { app: { localePath } } = useContext()
    const i18n = useI18n()

    const unprocessedUrl = {
      text: 'home',
      to: 'index'
    }

    const processedUrl = {
      text: i18n.t('home'),
      to: localePath('index')
    }

    return { unprocessedUrl, processedUrl, locale: i18n.locale }
  }
})
</script>
