import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ignore from "ignore";
import { visit } from "jsonc-parser";
import {
    validate,
    validateFunding,
    validateMain,
    validatePeerDependenciesMeta,
} from "package-json-validator";
import manifest from "../package.json" with { type: "json" };

const fields: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    peerDependenciesMeta?: Record<string, unknown>;
} = manifest;
const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
    peerDependenciesMeta,
} = fields;

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

for (const name of Object.keys(dependencies)) {
    if (
        Object.hasOwn(devDependencies, name) ||
        Object.hasOwn(peerDependencies, name)
    ) {
        errorMessages.push(
            `Dependency also declared as a dev or peer dependency: ${name}`,
        );
    }
}

for (const name of Object.keys(peerDependencies)) {
    if (!Object.hasOwn(devDependencies, name)) {
        errorMessages.push(
            `Peer dependency missing from devDependencies: ${name}`,
        );
    }
}

if (peerDependenciesMeta) {
    errorMessages.push(
        ...validatePeerDependenciesMeta(peerDependenciesMeta).errorMessages,
    );
    for (const name of Object.keys(peerDependenciesMeta)) {
        if (!Object.hasOwn(peerDependencies, name)) {
            errorMessages.push(
                `Peer metadata has no corresponding peer dependency: ${name}`,
            );
        }
    }
}

const projectRoot = join(import.meta.dirname, "..");
const ignored = ignore()
    .add(readFileSync(join(projectRoot, ".gitignore"), "utf8"))
    .add([".*", "package-lock.json"]);

function* jsonFiles(directory = ""): Generator<string> {
    for (const entry of readdirSync(join(projectRoot, directory), {
        withFileTypes: true,
    })) {
        const path = `${directory}${entry.name}`;
        if (entry.isDirectory()) {
            const child = `${path}/`;
            if (!ignored.ignores(child)) yield* jsonFiles(child);
        } else if (
            entry.isFile() &&
            path.endsWith(".json") &&
            !ignored.ignores(path)
        ) {
            yield path;
        }
    }
}

for (const file of jsonFiles()) {
    const objectKeys: Set<string>[] = [];
    visit(readFileSync(join(projectRoot, file), "utf8"), {
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
