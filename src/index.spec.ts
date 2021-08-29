import { readdirSync } from "fs";
import { resolve } from "path";
import { Parser, ParserOptions } from "htmlparser2";
import Handler, { Node, DomHandlerOptions } from ".";

const basePath = resolve(__dirname, "__fixtures__");

describe("DomHandler", () => {
    readdirSync(basePath)
        .filter((name) => name.endsWith(".json")) // Only allow .json files
        .map((name) => resolve(basePath, name))
        .map(require)
        .forEach(({ name, html, options = {}, expected }) =>
            test(name, () => {
                const result = parse(html, options);

                compare(result, expected);
            })
        );
});

function parse(
    data: string,
    options: DomHandlerOptions & ParserOptions
): Node[] {
    const results: Node[][] = [];

    const handler = new Handler((err: Error | null, actual: Node[]) => {
        expect(err).toBeNull();
        results.push(actual);
    }, options);

    const parser = new Parser(handler, options);

    // First, try to run the fixture via chunks
    for (let i = 0; i < data.length; i++) {
        parser.write(data.charAt(i));
    }

    parser.done();

    // Then parse everything
    parser.parseComplete(data);

    // Ensure streaming doesn't change anything.
    expect(results[0]).toEqual(results[1]);

    return results[0];
}

function compare<T>(actual: T, expected: T) {
    expect(typeof actual).toBe(typeof expected);
    if (typeof expected !== "object" || expected === null) {
        expect(actual).toBe(expected);
    } else {
        for (const prop in expected) {
            expect(prop in actual).toBeTruthy();
            compare(actual[prop], expected[prop]);
        }
    }
}
