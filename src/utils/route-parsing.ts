/**
 * segment parser, forked from the below:
 * - original repository url: https://github.com/nuxt/nuxt
 * - code url: https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/pages/utils.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import { encodePath } from 'ufo'

enum SegmentParserState {
  initial,
  static,
  dynamic,
  optional,
  catchall,
  group,
}

enum SegmentTokenType {
  static,
  dynamic,
  optional,
  catchall,
  group,
}

interface SegmentToken {
  type: SegmentTokenType
  value: string
}

const COLON_RE = /:/g
export function getRoutePath(tokens: SegmentToken[]): string {
  return tokens.reduce((path, token) => {
    return (
      path
      + (token.type === SegmentTokenType.optional
        ? `:${token.value}?`
        : token.type === SegmentTokenType.dynamic
          ? `:${token.value}()`
          : token.type === SegmentTokenType.catchall
            ? `:${token.value}(.*)*`
            : token.type === SegmentTokenType.group
              ? ''
              : encodePath(token.value).replace(COLON_RE, '\\:'))
    )
  }, '/')
}

const PARAM_CHAR_RE = /[\w.]/

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
              : state === SegmentParserState.catchall
                ? SegmentTokenType.catchall
                : SegmentTokenType.group,
      value: buffer,
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
        } else if (c === '(') {
          state = SegmentParserState.group
        } else {
          i--
          state = SegmentParserState.static
        }
        break

      case SegmentParserState.static:
        if (c === '[') {
          consumeBuffer()
          state = SegmentParserState.dynamic
        } else if (c === '(') {
          consumeBuffer()
          state = SegmentParserState.group
        } else {
          buffer += c
        }
        break

      case SegmentParserState.catchall:
      case SegmentParserState.dynamic:
      case SegmentParserState.optional:
      case SegmentParserState.group:
        if (buffer === '...') {
          buffer = ''
          state = SegmentParserState.catchall
        }
        if (c === '[' && state === SegmentParserState.dynamic) {
          state = SegmentParserState.optional
        }
        if (c === ']' && (state !== SegmentParserState.optional || segment[i - 1] === ']')) {
          if (!buffer) {
            throw new Error('Empty param')
          } else {
            consumeBuffer()
          }
          state = SegmentParserState.initial
        } else if (c === ')' && state === SegmentParserState.group) {
          if (!buffer) {
            throw new Error('Empty group')
          } else {
            consumeBuffer()
          }
          state = SegmentParserState.initial
        } else if (c && PARAM_CHAR_RE.test(c)) {
          buffer += c
        } else {
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
