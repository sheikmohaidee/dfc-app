/**
 * ESLint for the mobile app.
 *
 * The rule that earns its keep here is `react-hooks/exhaustive-deps`. This app
 * holds live Firestore subscriptions and a GPS watcher inside effects, and a
 * missing dependency there is not a style problem — it is a listener bound to
 * a stale closure, which shows up as a rider screen that quietly stops
 * updating. That is the failure you cannot reproduce at a desk.
 *
 * Everything else is kept quiet on purpose. Formatting is not litigated, and
 * `any` is a warning rather than an error because the React Native and Expo
 * surface genuinely has untyped corners.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      // React Native's runtime is neither browser nor plain Node, so the
      // globals are listed rather than inherited from an env preset.
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        __DEV__: 'readonly',
        require: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Escalated: see the note at the top of this file.
      'react-hooks/exhaustive-deps': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // three.js and some Expo modules are loaded with require() so a missing
      // native module cannot crash the login screen.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    // babel.config.js, metro.config.js, tailwind.config.js are CommonJS build
    // config that Node runs directly — `module`, `require` and `__dirname` are
    // exactly right there, and TypeScript never sees these files.
    files: ['*.config.js', '*.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
