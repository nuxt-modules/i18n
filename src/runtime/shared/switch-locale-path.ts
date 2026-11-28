import type { NuxtSSRContext } from '#app'

// server renders that contain a `SwitchLocalePathLink`, so only those pay for the html rewrite
const renders = new WeakSet<NuxtSSRContext>()

export function markSwitchLocalePathLink(ssrContext: NuxtSSRContext | undefined) {
  if (ssrContext) { renders.add(ssrContext) }
}

export function hasSwitchLocalePathLink(ssrContext: NuxtSSRContext | undefined) {
  return !!ssrContext && renders.has(ssrContext)
}
