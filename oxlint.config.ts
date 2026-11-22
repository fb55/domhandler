import { builtinModules } from "node:module";
import { defineConfig, type OxlintConfig } from "oxlint";
import manifest from "./package.json" with { type: "json" };

const runtimePackages = Object.keys(manifest.dependencies);
const toolingPackages = Object.keys(manifest.devDependencies);

/**
 * Rules turned off (each group says why they do not fit this code).
 *
 * @param rules The names of the rules.
 * @returns The rules, each turned off.
 */
const off = (...rules: string[]): Record<string, "off"> =>
    Object.fromEntries(rules.map((rule) => [rule, "off"]));

const config: OxlintConfig = defineConfig({
    plugins: [
        "eslint",
        "typescript",
        "unicorn",
        "oxc",
        "import",
        "jsdoc",
        "node",
        "promise",
        "vitest",
    ],
    // Every rule, except those turned off below.
    categories: {
        correctness: "error",
        suspicious: "error",
        pedantic: "error",
        perf: "error",
        style: "error",
        restriction: "error",
    },
    options: { typeAware: true, reportUnusedDisableDirectives: "error" },
    ignorePatterns: ["coverage/", "dist/", "docs/", "src/__fixtures__/"],
    rules: {
        "no-restricted-imports": [
            "error",
            {
                patterns: [
                    {
                        group: [
                            "**",
                            "!./**",
                            "!../**",
                            "!node:*{,/**}",
                            ...[
                                ...builtinModules,
                                ...runtimePackages,
                                ...toolingPackages,
                            ].map((name) => `!${name}{,/**}`),
                        ],
                        message:
                            "Declare tooling dependencies in package.json before importing them.",
                    },
                ],
            },
        ],
        eqeqeq: ["error", "smart"],
        "one-var": ["error", "never"],
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
        "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
        "prefer-destructuring": ["error", { object: true, array: false }],
        "capitalized-comments": [
            "error",
            "always",
            // (Lines continuing a comment continue its sentence.)
            { ignorePattern: "oxfmt-ignore", ignoreConsecutiveComments: true },
        ],
        yoda: ["error", "never"],
        curly: ["error", "multi-line"],
        "no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "typescript/no-unnecessary-condition": "error",
        "vitest/consistent-test-filename": [
            "error",
            { pattern: String.raw`\.spec\.ts$` },
        ],
        "vitest/consistent-test-it": ["error", { fn: "it" }],
        "unicorn/numeric-separators-style": [
            "error",
            { hexadecimal: { onlyIfContainsSeparator: true } },
        ],
        "typescript/explicit-member-accessibility": [
            "error",
            { accessibility: "no-public" },
        ],
        "typescript/explicit-function-return-type": [
            "error",
            { allowExpressions: true },
        ],
        "typescript/no-confusing-void-expression": [
            "error",
            { ignoreArrowShorthand: true },
        ],
        "typescript/switch-exhaustiveness-check": [
            "error",
            { considerDefaultExhaustiveForUnions: true },
        ],
        "vitest/prefer-lowercase-title": ["error", { ignore: ["describe"] }],
        // DOM node type IDs are standardized numbers, and T is a conventional type parameter.
        ...off("no-magic-numbers", "id-length"),
        // Node APIs use null for absent links and accept undefined for optional inputs.
        ...off(
            "unicorn/no-null",
            "no-undefined",
            "unicorn/no-useless-undefined",
        ),
        // Modern syntax and the runtime's features are fine.
        ...off(
            "oxc/no-async-await",
            "oxc/no-optional-chaining",
            "oxc/no-rest-spread-properties",
            "no-plusplus",
            "no-continue",
            "no-ternary",
            "no-nested-ternary",
            "unicorn/no-nested-ternary",
            "unicorn/no-array-reduce",
            "no-await-in-loop",
            "promise/avoid-new",
            "promise/prefer-await-to-then",
            "node/no-top-level-await",
            "node/no-sync",
            "import/no-nodejs-modules",
            "unicorn/import-style",
        ),
        // Async functions without `await` return their values and errors as promises.
        ...off("require-await", "typescript/require-await"),
        // Sizes, and orders that do not follow the code's structure.
        ...off(
            "max-params",
            "max-statements",
            "max-lines",
            "max-lines-per-function",
            "max-classes-per-file",
            "unicorn/max-nested-calls",
            "sort-keys",
            "no-use-before-define",
            "no-inline-comments",
            "init-declarations",
        ),
        // Keep the existing import and export order and module structure.
        ...off(
            "sort-imports",
            "import/consistent-type-specifier-style",
            "import/no-named-export",
            "import/no-default-export",
            "import/prefer-default-export",
            "import/group-exports",
            "import/exports-last",
            "import/no-relative-parent-imports",
        ),
        // TypeScript has the types (and infers them for readonly values and assertions).
        ...off(
            "jsdoc/require-param-type",
            "jsdoc/require-returns-type",
            "jsdoc/require-yields-type",
            "jsdoc/require-throws-type",
            "typescript/prefer-readonly-parameter-types",
            "typescript/no-unsafe-type-assertion",
            "typescript/no-non-null-assertion",
            "typescript/promise-function-async",
        ),
        // Method signatures, mapped types, `{}` and type aliases are chosen for how they check and infer.
        ...off(
            "typescript/method-signature-style",
            "typescript/consistent-indexed-object-style",
            "typescript/consistent-type-definitions",
            "typescript/ban-types",
            "no-redeclare",
        ),
        // Nullish equality is allowed by eqeqeq's smart mode.
        ...off("no-eq-null"),
        // Synchronous tests import their APIs explicitly and check exact values.
        ...off(
            "vitest/prefer-expect-assertions",
            "vitest/require-test-timeout",
            "vitest/no-importing-vitest-globals",
            "vitest/require-hook",
            "vitest/max-expects",
            "vitest/prefer-to-be-truthy",
            "vitest/prefer-to-be-falsy",
        ),
    },
    overrides: [
        {
            // Published modules run in browsers.
            files: ["src/**/*.ts"],
            excludeFiles: ["**/*.spec.ts"],
            rules: {
                "import/no-nodejs-modules": "error",
                "no-restricted-imports": [
                    "error",
                    {
                        patterns: [
                            // Check test paths before allowing relative imports.
                            {
                                regex: String.raw`(?:^|/)(?:__fixtures__|__snapshots__|__tests__|tests?)(?:/|$)|\.(?:spec|test)(?:\.[cm]?[jt]sx?)?$`,
                                message:
                                    "Published modules must not import tests or fixtures.",
                            },
                            {
                                group: [
                                    "**",
                                    "!./**",
                                    "!../**",
                                    ...runtimePackages.map(
                                        (name) => `!${name}{,/**}`,
                                    ),
                                ],
                                message:
                                    "Published modules may import only runtime dependencies and relative modules.",
                            },
                        ],
                    },
                ],
                // Keep indexed sibling lookup in parser and traversal hot paths.
                ...off("unicorn/prefer-at"),
            },
        },
        {
            files: ["src/index.ts"],
            rules: {
                // The constructor normalizes legacy positional arguments in place.
                ...off("no-param-reassign"),
                // Omitted and false parser options both disable index tracking.
                "typescript/strict-boolean-expressions": [
                    "error",
                    { allowNullableBoolean: true },
                ],
            },
        },
        {
            files: ["src/node.ts"],
            rules: {
                // Preserve DOM-compatible prototype getters and their existing API docs.
                ...off(
                    "typescript/class-literal-property-style",
                    "jsdoc/require-returns",
                ),
                "class-methods-use-this": [
                    "error",
                    { exceptMethods: ["nodeType"] },
                ],
            },
        },
        {
            // A namespace keeps node constructors and predicates together in tests.
            files: ["src/node.spec.ts"],
            rules: off("import/no-namespace"),
        },
        {
            // The recursive comparison asserts primitives and object properties separately.
            files: ["src/index.spec.ts"],
            rules: {
                ...off("vitest/no-conditional-expect"),
                "vitest/expect-expect": [
                    "error",
                    { assertFunctionNames: ["expect", "compare"] },
                ],
            },
        },
    ],
});

export default config;
