module.exports = {
  root: true,
  extends: [
    '@nuxtjs/eslint-config-typescript'
  ],
  plugins: [
    'jest'
  ],
  rules: {
    'arrow-parens': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
}
