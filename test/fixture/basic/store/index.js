/**
 * @typedef {{
 *   localeDomains: Record<string, string>
 *   routePathFr: string
 * }} State
 *
 * @typedef {import('vuex').Store<State>} TestStore
 */

/** @return {TestStore['state']} */
export const state = () => ({
  localeDomains: {
    ua: 'ua-runtime.nuxt-app.localhost'
  },
  routePathFr: ''
})

/** @type {import('vuex').MutationTree<State>} */
export const mutations = {
  setInitialRoutePath (state, path) {
    state.routePathFr = path
  }
}

/** @type {import('vuex').ActionTree<State, State>} */
export const actions = {
  nuxtServerInit ({ commit }) {
    commit('setInitialRoutePath', this.switchLocalePath('fr'))
  }
}
