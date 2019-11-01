<template>
  <div>
    <h2>Subcategory {{ $route.params.subCategory }}</h2>
    <h3>Post {{ $route.params.id }}</h3>
    <LangSwitcher />
  </div>
</template>

<script>
import LangSwitcher from '../../../../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  }
}
</script>
