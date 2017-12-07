<template>
<div>
  <LangSwitcher />
  {{ $t('posts') }}
  <router-view></router-view>
</div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  }
}
</script>
