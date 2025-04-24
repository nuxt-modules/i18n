import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { useSwitchLocalePath } from '#i18n'

const switchLocalePathLinkWrapperExpr = new RegExp(
  [
    `<!--${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}-\\[(\\w+)\\]-->`,
    `.+?`,
    `<!--/${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}-->`
  ].join(''),
  'g'
)

// Replace `SwitchLocalePathLink` href in rendered html for SSR support
export default defineNuxtPlugin({
  name: 'i18n:plugin:switch-locale-path-ssr',
  dependsOn: ['i18n:plugin'],
  setup() {
    const nuxt = useNuxtApp()
    const switchLocalePath = useSwitchLocalePath()
    nuxt.hook('app:rendered', ctx => {
      if (ctx.renderResult?.html == null) return

      ctx.renderResult.html = ctx.renderResult.html.replaceAll(
        switchLocalePathLinkWrapperExpr,
        (match: string, p1: string) =>
          match.replace(/href="([^"]+)"/, `href="${encodeURI(switchLocalePath(p1 ?? ''))}"`)
      )
    })
  }
})
