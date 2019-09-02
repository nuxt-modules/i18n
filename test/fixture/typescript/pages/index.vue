<template>
  <div>
    Home
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  nuxtI18n: {
    paths: {
      pl: '/polish'
    }
  },
  head() {
    return {
      title: 'Home'
    }
  }
})
export default class Home extends Vue {
  async mounted() {
    await (this as any).$message.info('This is a normal message')
  }
}
</script>
