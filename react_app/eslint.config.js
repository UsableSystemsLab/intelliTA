import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Prevent hardcoded user-facing strings in JSX. Use t("key") from
      // react-i18next instead. Brand names, symbols, separators, and other
      // non-translatable tokens are allow-listed below.
      'react/jsx-no-literals': [
        'warn',
        {
          noStrings: false,
          allowedStrings: [
            'IntelliTA',
            'Google',
            'GitHub',
            'AI',
            'AI-Powered',
            'Aa',
            'OR',
            ':',
            ',',
            '.',
            '-',
            '/',
            '|',
            '*',
            '#',
            '@',
            '+',
            '✕',
            '×',
            '...',
            '…',
            '©',
          ],
          ignoreProps: true,
          noAttributeStrings: false,
        },
      ],
    },
  },
]
