/**
 * @typedef {{
 *   routePathFr: string
 * }} State
 *
 * @typedef {import('vuex').Store<State>} TestStore
 */

/** @return {TestStore['state']} */
export const state = () => ({
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
