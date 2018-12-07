<template>
<div>
  <nuxt-link
    exact
    :to="localePath({
      name: 'posts-slug',
      params: {
        slug: 'my-slug'
      }
    })">my-slug</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  nuxtI18n: {
    paths: {
      fr: '/poste/:slug'
    }
  }
}
</script>
