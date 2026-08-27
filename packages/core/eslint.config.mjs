/**
 * ESLint for @dfc/core.
 *
 * Core is plain TypeScript with no framework in it, so this is deliberately
 * short: catch unused code and genuinely dangerous constructs, and stay out of
 * the way otherwise. TypeScript strict mode plus 122 unit tests are the real
 * gates here; a linter that argues about style would only add noise to the one
 * package where the logic is already the most heavily tested.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Money and state machines. An `any` here would defeat the point of the
      // package, so this one is an error rather than a warning.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  {
    // Tests reach for casts to prove a runtime guard holds even when the type
    // says it cannot be reached — see the "never changes a price" test.
    files: ['src/__tests__/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
