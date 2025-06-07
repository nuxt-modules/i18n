import { vi } from 'vitest'

// setup global constants
vi.stubGlobal('__I18N_CACHE__', false)
vi.stubGlobal('__I18N_CACHE_LIFETIME__', -1)
vi.stubGlobal('__I18N_STRICT_SEO__', false)
vi.stubGlobal('__PARALLEL_PLUGIN__', false)

vi.stubGlobal('__TRAILING_SLASH__', false)
vi.stubGlobal('__DIFFERENT_DOMAINS__', false)
vi.stubGlobal('__MULTI_DOMAIN_LOCALES__', false)

vi.stubGlobal('__ROUTE_NAME_SEPARATOR__', '___')
vi.stubGlobal('__ROUTE_NAME_DEFAULT_SUFFIX__', 'default')
