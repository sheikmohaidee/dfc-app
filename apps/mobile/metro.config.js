// Metro, wired for an Expo app that sits *beside* an npm workspace root.
//
// apps/mobile is deliberately NOT an npm workspace (see the root package.json).
// Expo's tooling — babel-preset-expo, nativewind/metro, expo-router — resolves
// its peers from wherever it physically lands, and npm hoisting in a mixed
// web+native workspace kept moving those packages out from under it. A
// self-contained node_modules is boring and it always works.
//
// Two things still matter here:
//   watchFolders   so edits in packages/core hot-reload
//   extraNodeModules  so React resolves to exactly one copy — the repo root
//                     also has a React (the Next.js app's), and Metro can see
//                     it through watchFolders. Two Reacts in one bundle is the
//                     "invalid hook call" crash.
//
// Deliberately NOT set:
//   disableHierarchicalLookup      a pnpm workaround; breaks npm resolution
//   unstable_enablePackageExports  expo-router resolves its own subpaths
//                                  through package exports on SDK 54

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Pin the singletons to this app's copies.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// The Firebase JS SDK still ships some .cjs entry points.
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

module.exports = withNativeWind(config, { input: './global.css' });
