import js from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    name: 'formatLint',
    plugins: {
      '@stylistic': stylisticPlugin,
    },
    rules: {
      '@stylistic/semi': 'warn',
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-mixed-spaces-and-tabs': 'warn',
    },
  },
  {
    name: 'jsLint',
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: 'warn',
    },
  },
  {
    name: 'tsLint',
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
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
    ignores: [
      // dependencies
      'node_modules/',

      // runtime data
      'pids',
      '*.pid',
      '*.seed',

      // dev-tools
      '*.js',
      '*.mjs',
      '*.ts',

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
];
