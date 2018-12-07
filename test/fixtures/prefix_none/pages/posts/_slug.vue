<template>
<div>
  <h1>{{ $route.params.slug }}</h1>
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
  }
}
</script>
