import { WritableComputedRef } from '@nuxtjs/composition-api'
import { NuxtI18nApi, NuxtI18nHeadOptions, NuxtI18nMeta } from '../types/vue'
import { NuxtI18nInstance } from '../types'

interface NuxtI18nCompositionApi extends Omit<NuxtI18nInstance, 'locale'>, NuxtI18nApi {
  locale: WritableComputedRef<string>
  nuxtI18nHead(options?: NuxtI18nHeadOptions): NuxtI18nMeta
}

export declare function useI18n(): NuxtI18nCompositionApi
