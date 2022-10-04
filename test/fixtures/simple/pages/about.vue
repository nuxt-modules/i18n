<script lang="ts">
import { defineComponent } from 'vue'
import { defineI18nRoute } from '#i18n'

export default defineComponent({
  setup() {
    defineI18nRoute({
      paths: {
        en: '/about-us',
        fr: '/a-propos',
        ja: '/about-ja'
      }
    })
    return {}
  }
})
</script>
