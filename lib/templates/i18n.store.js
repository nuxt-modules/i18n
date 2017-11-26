export default {
  namespaced: true,

  state: () => ({
    locales: <%= JSON.stringify(options.locales) %>,
    currentLocale: '<%= options.defaultLocale %>'
  }),

  getters: {
    currentLocale: state => state.currentLocale
  },

  mutations: {
    I18N_SET_LOCALE (state, { locale }) {
      state.currentLocale = locale
    }
  },

  actions: {
    setLocale ({ commit }, { locale }) {
      commit('I18N_SET_LOCALE', { locale })
    }
  }
}
