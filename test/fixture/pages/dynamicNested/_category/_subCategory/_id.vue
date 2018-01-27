<template>
  <div>
    <div>Subcategory {{ $route.params.subCategory }}</div>
    <div>Post {{ $route.params.id }}</div>
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
