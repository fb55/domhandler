import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Parser, type ParserOptions } from "htmlparser2";
import Handler, { type DomHandlerOptions, type Node } from ".";

const basePath = resolve(__dirname, "__fixtures__");

describe("DomHandler", () => {
    for (const { name, html, options = {}, expected } of readdirSync(basePath)
        .filter((name) => name.endsWith(".json")) // Only allow .json files
        .map((name) => resolve(basePath, name))
        .map(require)) {
        test(name, () => {
            const result = parse(html, options);

            compare(result, expected);
        });
    }
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

    parser.done();

    // Then parse everything
    parser.parseComplete(data);

    // Ensure streaming doesn't change anything.
    expect(results[0]).toEqual(results[1]);

    return results[0];
}

function compare(actual: unknown, expected: unknown) {
    if (
        typeof expected !== "object" ||
        expected === null ||
        typeof actual !== "object" ||
        actual === null
    ) {
        expect(actual).toBe(expected);
    } else {
        for (const property in expected) {
            expect(property in actual).toBeTruthy();
            compare(actual[property as never], expected[property as never]);
        }
    }
}
