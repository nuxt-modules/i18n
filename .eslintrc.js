module.exports = {
  root: true,
  extends: ['@nuxtjs/eslint-config-typescript'],
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
    '@typescript-eslint/no-unused-vars': [
      2,
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    'arrow-parens': 0,
    'import/named': 0,
    'import/namespace': 0,
    'no-console': [
      2,
      {
        allow: ['assert', 'warn', 'error', 'info']
      }
    ],
    'no-unused-vars': [
      2,
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    'vue/html-closing-bracket-newline': 0,
    'vue/multiline-html-element-content-newline': 0,
    'vue/singleline-html-element-content-newline': 0
  }
}
