import { resolveFiles } from '@nuxt/kit'
import { parse } from 'pathe'
import { encodePath } from 'ufo'
import { isObject, isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions, LocaleInfo } from './types'

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

export function getNormalizedLocales(locales: NuxtI18nOptions['locales']): LocaleObject[] {
  locales = locales || []
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale, iso: locale })
    } else {
      normalized.push(locale)
    }
  }
  return normalized
}

export async function resolveLocales(path: string, locales: LocaleObject[]): Promise<LocaleInfo[]> {
  const files = await resolveFiles(path, '**/*{json,json5,yaml,yml}')
  return files.map(file => {
    const parsed = parse(file)
    const locale = locales.find((locale: string | LocaleObject) => isObject(locale) && locale.file === parsed.base)
    return locales == null
      ? {
          path: file,
          file: parsed.base,
          code: parsed.name
        }
      : Object.assign({ path: file }, locale)
  })
}

/**
 * sergment parser, forked from the below:
 * - original repository url: https://github.com/nuxt/framework
 * - code url: https://github.com/nuxt/framework/blob/main/packages/nuxt/src/pages/utils.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

enum SegmentParserState {
  initial,
  static,
  dynamic,
  optional,
  catchall
}

enum SegmentTokenType {
  static,
  dynamic,
  optional,
  catchall
}

interface SegmentToken {
  type: SegmentTokenType
  value: string
}

const PARAM_CHAR_RE = /[\w\d_.]/

export function parseSegment(segment: string) {
  let state: SegmentParserState = SegmentParserState.initial
  let i = 0

  let buffer = ''
  const tokens: SegmentToken[] = []

  function consumeBuffer() {
    if (!buffer) {
      return
    }
    if (state === SegmentParserState.initial) {
      throw new Error('wrong state')
    }

    tokens.push({
      type:
        state === SegmentParserState.static
          ? SegmentTokenType.static
          : state === SegmentParserState.dynamic
          ? SegmentTokenType.dynamic
          : state === SegmentParserState.optional
          ? SegmentTokenType.optional
          : SegmentTokenType.catchall,
      value: buffer
    })

    buffer = ''
  }

  while (i < segment.length) {
    const c = segment[i]

    switch (state) {
      case SegmentParserState.initial:
        buffer = ''
        if (c === '[') {
          state = SegmentParserState.dynamic
        } else {
          i--
          state = SegmentParserState.static
        }
        break

      case SegmentParserState.static:
        if (c === '[') {
          consumeBuffer()
          state = SegmentParserState.dynamic
        } else {
          buffer += c
        }
        break

      case SegmentParserState.catchall:
      case SegmentParserState.dynamic:
      case SegmentParserState.optional:
        if (buffer === '...') {
          buffer = ''
          state = SegmentParserState.catchall
        }
        if (c === '[' && state === SegmentParserState.dynamic) {
          state = SegmentParserState.optional
        }
        if (c === ']' && (state !== SegmentParserState.optional || buffer[buffer.length - 1] === ']')) {
          if (!buffer) {
            throw new Error('Empty param')
          } else {
            consumeBuffer()
          }
          state = SegmentParserState.initial
        } else if (PARAM_CHAR_RE.test(c)) {
          buffer += c
        } else {
          // eslint-disable-next-line no-console
          // console.debug(`[pages]Ignored character "${c}" while building param "${buffer}" from "segment"`)
        }
        break
    }
    i++
  }

  if (state === SegmentParserState.dynamic) {
    throw new Error(`Unfinished param "${buffer}"`)
  }

  consumeBuffer()

  return tokens
}

export function getRoutePath(tokens: SegmentToken[]): string {
  return tokens.reduce((path, token) => {
    // prettier-ignore
    return (
      path +
      (token.type === SegmentTokenType.optional
        ? `:${token.value}?`
        : token.type === SegmentTokenType.dynamic
          ? `:${token.value}`
          : token.type === SegmentTokenType.catchall
            ? `:${token.value}(.*)*`
            : encodePath(token.value))
    )
  }, '/')
}
