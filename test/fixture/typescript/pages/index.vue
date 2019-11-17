<template>
  <div>
    Home
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

const doSomething = async  (): Promise<any> => {}

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
  pages: Array<any> = []

  async mounted() {
    await (this as any).$message.info('This is a normal message')

    const result = await doSomething()
    this.pages = result.data?.pages ?? []
  }
}
</script>
