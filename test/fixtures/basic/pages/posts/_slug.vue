<template>
<div>
  <h2>{{ $route.params.slug }}</h2>
  <nuxt-link
    exact
    :to="localePath('posts')">index</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  async asyncData ({ app, store }) {
    const params = await new Promise(resolve => {
      resolve({
        en: { slug: 'my-post' },
        fr: { slug: 'mon-article' },
      })
    })
    await store.dispatch('i18n/setRouteParams', params)
    return {}
  }
}
</script>
