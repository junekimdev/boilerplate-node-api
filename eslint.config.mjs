import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'src/**/*.js',
      'test/**/*.js',
      'src/**/*.mjs',
      'test/**/*.mjs',
      'src/**/*.ts',
      'test/**/*.ts',
    ],
  },
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    ignores: [
      // dependencies
      'node_modules/',

      // runtime data
      'pids',
      '*.pid',
      '*.seed',

      // dev-tools
      '*.js',

      // testing
      'coverage/',

      // keys
      '*.pem',

      // production
      'build/',
      'release/',
      'dist/',
      'dll/',
      '.eslintcache',

      // debug
      '.idea',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',

      // logs
      'logs/',
      '*.log',

      // misc
      '.DS_Store',
      '.env*',
      '*.env',
      '.vscode/',
      'placeholder_*',
    ],
  },
  {
    rules: {
      eqeqeq: 'warn',
      semi: 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-extra-semi': 'error',
      'no-unreachable': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
