import path from 'path'

describe('parsePages', () => {
  test('parses in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/index.vue'))
    expect(options).toHaveProperty('paths')
    expect(options.paths).toHaveProperty('pl')
    expect(options.paths.pl).toBe('/polish')
  })

  test('triggers warning with invalid in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')

    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/invalidOptions.vue'))
    expect(spy.mock.calls[0][0]).toContain('Error parsing')
    spy.mockRestore()

    expect(Object.keys(options).length).toBe(0)
  })
})
