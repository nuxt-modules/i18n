export interface RenderHTMLContext {
  head: string[]
  bodyAppend: string[]
}

export interface ServerRedirect {
  location: string
  status: number
}

export interface I18nServerHooks<Event> {
  onRequest: (fn: (event: Event) => void | Promise<void>) => void
  onAfterResponse: (fn: (event: Event) => void | Promise<void>) => void
  /** Redirect a page request before it is rendered */
  onBeforeRender: (fn: (event: Event) => Promise<ServerRedirect | undefined>) => void
  onRenderHTML: (fn: (html: RenderHTMLContext, event: Event) => void) => void
}

export interface CacheOptions<Event> {
  name: string
  maxAge: number
  swr?: boolean
  getKey: (event: Event) => string
  shouldBypassCache: (event: Event) => boolean | Promise<boolean>
}
