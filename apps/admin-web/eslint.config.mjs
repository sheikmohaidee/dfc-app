/**
 * ESLint, flat config.
 *
 * The rules here are the ones that catch bugs rather than the ones that argue
 * about style — formatting is not litigated, because TypeScript strict mode
 * and the test suites are the real quality gates and a linter that shouts
 * about quote marks trains people to ignore it.
 *
 * What it is actually here for: the Next.js correctness rules (a client-only
 * hook in a server component, a bare <img>, a wrong <Link>), the React hooks
 * rules (a missing dependency is a stale-closure bug, and this codebase has
 * live Firestore listeners in effects), and unused code.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      // A missing effect dependency is a stale closure, and this app holds
      // live Firestore subscriptions in effects. Escalated to an error.
      'react-hooks/exhaustive-deps': 'error',

      // `_`-prefixed names are a deliberate "I know, I am not using this".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // `any` is sometimes the honest type at a Firebase boundary. Warn so it
      // stays visible without blocking a build.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
