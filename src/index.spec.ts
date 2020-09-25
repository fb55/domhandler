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
        .forEach((fixture) =>
            test(fixture.name, () => {
                const result = parse(
                    fixture.html,
                    fixture.options,
                    fixture.streaming
                );

                compare(result, fixture.expected);
            })
        );

    it("Should serialize to Jest snapshot", () => {
        const result = parse(
            "<html><!-- A Comment --><title>The Title</title><body>Hello world<input disabled type=text></body></html>"
        );
        expect(result).toMatchInlineSnapshot(`
            Array [
              <html>
                <!-- A Comment -->
                <title>
                  The Title
                </title>
                <body>
                  Hello world
                  <input
                    disabled=""
                    type="text"
                  />
                </body>
              </html>,
            ]
        `);
    });
});

function parse(
    data: string,
    options: DomHandlerOptions & ParserOptions = {},
    streaming = true
): Node[] {
    const results: Node[][] = [];

    const handler = new Handler((err: Error | null, actual: Node[]) => {
        expect(err).toBeNull();
        results.push(actual);
    }, options);

    const parser = new Parser(handler, options);

    // First, try to run the fixture via chunks
    if (streaming) {
        for (let i = 0; i < data.length; i++) {
            parser.write(data.charAt(i));
        }

        parser.done();
    }

    // Then parse everything
    parser.parseComplete(data);

    if (streaming) {
        // Ensure streaming doesn't change anything.
        expect(results[0]).toEqual(results[1]);
    }

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
