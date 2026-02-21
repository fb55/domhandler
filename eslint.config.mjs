import { includeIgnoreFile } from '@eslint/compat';
import feedicFlatConfig from '@feedic/eslint-config';
import { commonTypeScriptRules } from '@feedic/eslint-config/typescript';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import eslintConfigPrettier from 'eslint-config-prettier';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath),
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
      "@typescript-eslint/no-unused-vars": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      "n/no-unsupported-features/es-builtins": 0,
    },
  },
  eslintConfigPrettier
]);
