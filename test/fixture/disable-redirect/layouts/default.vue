<template>
  <div>
    <p><strong>Default Layout</strong></p>

    <NavBar />

    <LangSwitcher />

    <hr>

    <LangSwitcher force-prefix />

    <Nuxt />
  </div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'
import NavBar from '../components/NavBar'
export default {
  components: { NavBar, LangSwitcher }
}
</script>
