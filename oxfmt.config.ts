import { defineConfig, type OxfmtConfig } from "oxfmt";

const config: OxfmtConfig = defineConfig({
    printWidth: 80,
    tabWidth: 4,
    sortImports: true,
    sortPackageJson: true,
    ignorePatterns: [".*", "package-lock.json"],
});

export default config;
