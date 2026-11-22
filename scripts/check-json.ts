import { readFileSync, readdirSync } from "node:fs";
import { visit } from "jsonc-parser";
import {
    validate,
    validateFunding,
    validateMain,
} from "package-json-validator";
import manifest from "../package.json" with { type: "json" };

const { errorMessages } = validate(manifest, true);
errorMessages.push(
    ...validateFunding(manifest.funding).errorMessages,
    ...validateMain(manifest.main).errorMessages,
);

for (const field of [
    "description",
    "files",
    "license",
    "repository",
    "sideEffects",
    "type",
]) {
    if (!Object.hasOwn(manifest, field)) {
        errorMessages.push(`Missing package.json field: ${field}`);
    }
}

if (
    !Object.hasOwn(manifest, "author") &&
    !Object.hasOwn(manifest, "contributors")
) {
    errorMessages.push("Missing author or contributors in package.json");
}

for (const name of Object.keys(manifest.dependencies)) {
    if (Object.hasOwn(manifest.devDependencies, name)) {
        errorMessages.push(
            `Dependency also declared in devDependencies: ${name}`,
        );
    }
}

const fixtureDirectory = "src/__fixtures__/";
const fixtures = readdirSync(new URL(`../${fixtureDirectory}`, import.meta.url))
    .filter((name) => name.endsWith(".json"))
    .map((name) => `${fixtureDirectory}${name}`);

for (const file of [
    "package.json",
    "tsconfig.json",
    "tsconfig.build.json",
    ...fixtures,
]) {
    const objectKeys: Set<string>[] = [];
    visit(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
        onObjectBegin() {
            objectKeys.push(new Set());
        },
        onObjectProperty(key, _offset, _length, line) {
            const keys = objectKeys.at(-1)!;
            if (keys.has(key)) {
                errorMessages.push(`${file}:${line + 1}: Duplicate key ${key}`);
            }
            keys.add(key);
        },
        onObjectEnd() {
            objectKeys.pop();
        },
    });
}

if (errorMessages.length > 0) {
    throw new Error(`Invalid project JSON\n${errorMessages.join("\n")}`);
}
