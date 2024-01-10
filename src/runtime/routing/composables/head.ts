import { onUnmounted, ref, useRouter, watch } from '#imports'
import { localeHead } from '../compatibles'

import type { Ref } from '#imports'
import type { I18nHeadMetaInfo, I18nHeadOptions } from '#build/i18n.options.mjs'

/**
 * The `useLocaleHead` composable returns localized head properties for locale-related aspects.
 *
 * @param options - An options, see about details {@link I18nHeadOptions}
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
 *
 * @public
 */
export function useLocaleHead({
  addDirAttribute = false,
  addSeoAttributes = false,
  identifierAttribute = 'hid'
}: I18nHeadOptions = {}): Ref<I18nHeadMetaInfo> {
  const router = useRouter()

  const metaObject: Ref<I18nHeadMetaInfo> = ref({
    htmlAttrs: {},
    link: [],
    meta: []
  })

  function cleanMeta() {
    metaObject.value = {
      htmlAttrs: {},
      link: [],
      meta: []
    }
  }

  function updateMeta() {
    metaObject.value = localeHead({ addDirAttribute, addSeoAttributes, identifierAttribute }) as I18nHeadMetaInfo
  }

  if (process.client) {
    const stop = watch(
      () => router.currentRoute.value,
      () => {
        cleanMeta()
        updateMeta()
      },
      { immediate: true }
    )
    onUnmounted(() => stop())
  } else {
    updateMeta()
  }

  return metaObject
}
