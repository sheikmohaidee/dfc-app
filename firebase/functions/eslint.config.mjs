/**
 * ESLint for the Cloud Functions.
 *
 * This is the server, so the rules that matter are about *silence*: a promise
 * nobody awaited, an error nobody handled, a value nobody used. A dropped
 * await in a payment handler is exactly the kind of bug that returns 200 to
 * Razorpay and never writes the money.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // A floating promise in a webhook is a write that may never land.
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
    },
  },

  {
    // Test doubles impersonate SDK surfaces, which needs loose typing.
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
