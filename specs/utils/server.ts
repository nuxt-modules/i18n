/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { x } from 'tinyexec'
import { getRandomPort, waitForPort } from 'get-port-please'
import type { FetchOptions } from 'ofetch'
import { $fetch as _$fetch, fetch as _fetch } from 'ofetch'
import * as _kit from '@nuxt/kit'
import { resolve } from 'pathe'
import { useTestContext } from './context'
import { request } from 'undici'
import sirv from 'sirv'
import { createServer } from 'node:http'

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export async function startServer(env: Record<string, unknown> = {}) {
  const ctx = useTestContext()
  await stopServer()
  const host = '127.0.0.1'
  const ports = ctx.options.port ? toArray(ctx.options.port) : [await getRandomPort(host)]
  ctx.url = `http://${host}:${ports[0]}`
  if (ctx.options.dev) {
    ctx.serverProcess = x('nuxi', ['_dev'], {
      throwOnError: true,
      nodeOptions: {
        cwd: ctx.nuxt!.options.rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          _PORT: String(ports[0]), // Used by internal _dev command
          PORT: String(ports[0]),
          HOST: host,
          NODE_ENV: 'development',
          ...env
        }
      }
    })
    await waitForPort(ports[0], { retries: 32, host }).catch(() => {})
    let lastError
    for (let i = 0; i < 150; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        const res = await $fetch(ctx.nuxt!.options.app.baseURL)
        if (!res.includes('__NUXT_LOADING__')) {
          return
        }
      } catch (e) {
        lastError = e
      }
    }
    ctx.serverProcess.kill()
    throw lastError || new Error('Timeout waiting for dev server!')
  } else if (ctx.options.prerender) {
    const publicDir = ctx.nuxt!.options.nitro!.output?.publicDir
    const handler = sirv(publicDir, { dev: false, etag: true, single: false })
    const servers = ports.map(() => createServer((req, res) => {
      // normalize leading `//+` — sirv treats double-slash paths as literal
      // and 404s, while `serve` (the previous impl) silently normalized them
      if (req.url && /^\/{2,}/.test(req.url)) {
        req.url = req.url.replace(/^\/+/, '/')
      }
      handler(req, res, () => {
        res.statusCode = 404
        res.end()
      })
    }))

    await Promise.all(servers.map((server, i) => new Promise<void>((resolveListen, rejectListen) => {
      server.once('error', rejectListen)
      server.listen(ports[i], host, () => {
        server.off('error', rejectListen)
        resolveListen()
      })
    })))

    ctx.serverProcess = {
      kill: () => Promise.all(servers.map(server => new Promise<void>((resolveClose) => {
        server.closeAllConnections?.()
        server.close(() => resolveClose())
      }))).then(() => undefined)
    }

    try {
      await Promise.all(ports.map(port =>
        waitForPort(port, { retries: 50, host, delay: process.env.CI ? 1000 : 500 })
      ))
    } catch (e) {
      await stopServer()
      throw e
    }
  } else {
    ctx.serverProcess = x('node', [resolve(ctx.nuxt!.options.nitro.output!.dir!, 'server/index.mjs')], {
      throwOnError: true,
      nodeOptions: {
        stdio: ['inherit', 'inherit', 'pipe', 'ipc'],
        env: {
          ...process.env,
          PORT: String(ports[0]),
          HOST: host,
          ...env
        }
      }
    })

    const hiddenLogs = ['[Vue Router warn]: No match found for location with path']
    ctx.serverProcess.process?.stderr?.on('data', (msg: string) => {
      const str = msg.toString().trim()
      if (hiddenLogs.some(w => str.includes(w))) return
      console.error(str)
    })

    await waitForPort(ports[0], { retries: process.env.CI ? 50 : 200, host, delay: process.env.CI ? 500 : 100 })
  }
}

export async function stopServer() {
  const ctx = useTestContext()
  await ctx.serverProcess?.kill()
  ctx.serverProcess = undefined
}

export function fetch(path: string, options?: any) {
  return _fetch(url(path), options)
}

export function $fetch(path: string, options?: FetchOptions) {
  return _$fetch(url(path), options)
}

export function undiciRequest(path: string, options?: Parameters<typeof request>[1]) {
  return request(url(path), options)
}

export function url(path: string, port?: number) {
  const ctx = useTestContext()
  if (!ctx.url) {
    throw new Error('url is not available (is server option enabled?)')
  }

  if (path.startsWith(ctx.url)) {
    return path
  }

  // replace port in url
  if (port != null) {
    return ctx.url.slice(0, ctx.url.lastIndexOf(':')) + `:${port}` + path
  }

  return ctx.url + path
}

/* eslint-enable @typescript-eslint/no-non-null-assertion */
