import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { fetch, setup, url } from '../utils'

describe('#3910 - i18n disable for route needs priority to catch-all route on SSR', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3910`, import.meta.url)),
  })

  const URL_PATHNAME = '/test';

  test('should not redirect i18n disable routes', async () => {
    const res = await fetch(url(URL_PATHNAME));

    const u = new URL(res.url);
    expect(res.status).toBe(200);
    expect(u.pathname).toBe(URL_PATHNAME);
    expect(await res.text()).toContain('Test page not localized');
  })
})
