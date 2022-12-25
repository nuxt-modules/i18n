export default defineAppConfig({
  myProject: {
    name: 'This is Nuxt layer'
  }
})

declare module '@nuxt/schema' {
  interface AppConfigInput {
    myProject?: {
      /** Project name */
      name?: string
    }
  }
}
