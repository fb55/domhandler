import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Parser, type ParserOptions } from "htmlparser2";
import { describe, expect, it } from "vitest";
import Handler, { type DomHandlerOptions, type Node } from "./index.js";

const basePath = resolve(import.meta.dirname, "__fixtures__");

interface Fixture {
    name: string;
    html: string;
    options?: DomHandlerOptions & ParserOptions;
    expected: unknown;
}

describe("DomHandler", () => {
    const fixtures = readdirSync(basePath)
        .filter((name) => name.endsWith(".json"))
        .map((name) => resolve(basePath, name))
        .map((path) => JSON.parse(readFileSync(path, "utf8")) as Fixture);

    it.each(fixtures)("$name", ({ html, options = {}, expected }) => {
        const result = parse(html, options);

        compare(result, expected);
    });
});

function parse(
    data: string,
    options: DomHandlerOptions & ParserOptions,
): Node[] {
    const results: Node[][] = [];

    const handler = new Handler((error: Error | null, actual: Node[]) => {
        expect(error).toBeNull();
        results.push(actual);
    }, options);

    const parser = new Parser(handler, options);

    // First, try to run the fixture via chunks
    for (let index = 0; index < data.length; index++) {
        parser.write(data.charAt(index));
    }

    parser.end();

    // Then parse everything
    parser.parseComplete(data);

    // Ensure streaming doesn't change anything.
    expect(results[0]).toStrictEqual(results[1]);

    return results[0];
}

function compare(actual: unknown, expected: unknown): void {
    if (
        typeof expected !== "object" ||
        expected === null ||
        typeof actual !== "object" ||
        actual === null
    ) {
        expect(actual).toBe(expected);
    } else {
        for (const property of Object.keys(expected)) {
            expect(actual).toHaveProperty([property]);
            compare(actual[property as never], expected[property as never]);
        }
    }
}
