import { defineNuxtModule } from '@nuxt/kit'
import { colors } from './tailwind.config'

export default defineNuxtModule({
  setup(_, nuxt) {
    nuxt.hook('tailwindcss:config', function (tailwindConfig) {
      tailwindConfig.theme.extend.colors.primary = colors.green
    })
  }
})
