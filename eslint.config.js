const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: [
            './apps/api/tsconfig.json',
            './apps/mobile/tsconfig.json',
            './packages/shared/tsconfig.json',
          ],
        },
      },
    },
    ignores: [
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/generated/**',
      'apps/api/prisma/generated/**',
    ],
  },
]);
