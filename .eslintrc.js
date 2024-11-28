module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-extra-semi': 'off',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-duplicate-imports': 'warn',
    // 'indent': ['warn', 2],
    // 'quotes': ['warn', 'single'],
    'semi': 'off',
    'eqeqeq': ['warn', 'always'],
    'no-var': 'warn',
    'prefer-const': 'warn',
    'max-len': ['warn', { 
      code: 120,
      ignoreComments: true,
      ignoreStrings: true
    }],
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-var-requires': 'off',
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['build/**/*', 'node_modules/**/*'],
  overrides: [
    {
      files: ['**/tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    }
  ]
}; 