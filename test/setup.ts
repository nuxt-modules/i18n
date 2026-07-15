import { vi } from 'vitest'

// setup global constants
vi.stubGlobal('__I18N_CACHE__', false)
vi.stubGlobal('__I18N_CACHE_LIFETIME__', -1)
vi.stubGlobal('__I18N_HTTP_CACHE_DURATION__', 10)
vi.stubGlobal('__I18N_STRICT_SEO__', false)
vi.stubGlobal('__PARALLEL_PLUGIN__', false)

vi.stubGlobal('__TRAILING_SLASH__', false)
vi.stubGlobal('__I18N_DOMAINS__', false)

vi.stubGlobal('__ROUTE_NAME_SEPARATOR__', '___')
vi.stubGlobal('__ROUTE_NAME_DEFAULT_SUFFIX__', 'default')

vi.stubGlobal('__I18N_COMPACT_ROUTES__', false)
vi.stubGlobal('__DYNAMIC_PARAMS_KEY__', 'nuxtI18nInternal')

vi.stubGlobal('__I18N_ROUTING__', true)
vi.stubGlobal('__I18N_STRATEGY__', 'prefix_except_default')
vi.stubGlobal('__DEFAULT_DIRECTION__', 'ltr')
