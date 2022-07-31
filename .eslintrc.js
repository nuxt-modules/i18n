module.exports = {
  root: true,
  extends: [
    '@nuxtjs/eslint-config-typescript'
  ],
  plugins: [
    'jest'
  ],
  env: {
    'jest/globals': true
  },
  overrides: [
    {
      files: [
        'test/**/*'
      ],
      plugins: [
        'jest'
      ]
    }
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'arrow-parens': 'off',
    'import/named': 'off',
    'import/namespace': 'off',
    'no-console': [
      'error', {
        allow: ['assert', 'warn', 'error', 'info']
      }
    ],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'vue/multi-word-component-names': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
}
