import { Parser, ParserOptions } from "htmlparser2";
import Handler, { Node, DomHandlerOptions } from ".";

describe("Nodes", () => {
    it("should serialize to a Jest snapshot", () => {
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

    it("should be cloneable", () => {
        const [result] = parse(
            `<html><!-- A Comment -->
                <!doctype html>
                <title>The Title</title>
                <body>Hello world<input disabled type=text></body>
                <script><![CDATA[secret script]]></script>
            </html>`
        );
        expect(result.cloneNode(true)).toStrictEqual(result);
    });

    it("should not clone recursively if not asked to", () => {
        const [result] = parse("<div foo=bar><div><div>");
        expect(result.cloneNode(true)).toEqual(result);
        expect(result.cloneNode(false)).not.toEqual(result);
        expect(result.cloneNode()).toHaveProperty("children", []);
    });

    it("should clone startIndex and endIndex", () => {
      const [result] = parse("<div foo=bar><div><div>", {
          withStartIndices: true,
          withEndIndices: true,
      });
      const clone = result.cloneNode(true);
      expect(clone.startIndex).toBe(0);
      expect(clone.endIndex).toBe(22);
    });
});

type Options = DomHandlerOptions & ParserOptions;
function parse(data: string, options: Options = {}): Node[] {
    let result: Node[] | undefined;
    const handler = new Handler((err, actual) => {
        if (err) throw err;
        result = actual;
    }, options);

    const parser = new Parser(handler, options);

    parser.end(data);

    return result as Node[];
}
