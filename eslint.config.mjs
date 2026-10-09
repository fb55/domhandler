import { includeIgnoreFile } from '@eslint/compat';
import feedicFlatConfig from '@feedic/eslint-config';
import { commonTypeScriptRules } from '@feedic/eslint-config/typescript';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import eslintConfigBiome from 'eslint-config-biome';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    ignores: ['eslint.config.{js,cjs,mjs}'],
  },
  ...feedicFlatConfig,
  {
    files: ['**/*.spec.ts'],
    rules: {
      'n/no-unsupported-features/node-builtins': 0,
      'unicorn/import-style': 0,
      'unicorn/no-array-callback-reference': 0,
    },
  },
  {
    files: [
        "**/*.ts"
    ],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
          "sourceType": "module",
          "project": "./tsconfig.eslint.json"
      },
    },
    rules: {
      ...commonTypeScriptRules,
      "n/no-unsupported-features/es-builtins": 0,
    },
  },
  eslintConfigBiome,
// These nodes implement domhandler APIs, not the browser DOM.
{
    "files": [
        "**/*.ts"
    ],
    "rules": {
        "unicorn/better-dom-traversing": "off"
    }
},
// Preserve class field initialization order and the public node layout.
{
    "files": [
        "src/index.ts",
        "src/node.ts"
    ],
    "rules": {
        "unicorn/consistent-class-member-order": "off"
    }
},
// Keep the public recursive clone parameter name.
{
    "files": [
        "src/node.ts"
    ],
    "rules": {
        "unicorn/consistent-boolean-name": "off"
    }
},
// Fixture comparison checks dynamic keys, including inherited properties.
{
    "files": [
        "src/index.spec.ts"
    ],
    "rules": {
        "unicorn/no-computed-property-existence-check": "off"
    }
},

// Biome enforces the Number namespace for these constants.
{
    "files": [
        "**/*.ts"
    ],
    "rules": {
        "unicorn/prefer-global-number-constants": "off"
    }
},
]);
