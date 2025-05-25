import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { useSwitchLocalePath } from '#i18n'

const identifier = __SWITCH_LOCALE_PATH_LINK_IDENTIFIER__
const switchLocalePathLinkWrapperExpr = new RegExp(
  [`<!--${identifier}-\\[(\\w+)\\]-->`, `.+?`, `<!--/${identifier}-->`].join(''),
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
        (match: string, p1: string) => {
          const encoded = encodeURI(switchLocalePath(p1 ?? ''))
          return match.replace(
            /href="([^"]+)"/,
            `href="${encoded || '#'}" ${!encoded && __I18N_STRICT_SEO__ ? 'data-i18n-disabled' : ''}`
          )
        }
      )
    })
  }
})
