import { ElementType } from "domelementtype";
import { Parser, ParserOptions } from "htmlparser2";
import Handler, { NodeWithChildren, DomHandlerOptions } from ".";
import * as node from "./node";

describe("Nodes", () => {
    it("should serialize to a Jest snapshot", () => {
        const result = parse(
            "<html><!-- A Comment --><title>The Title</title><body>Hello world<input disabled type=text></body></html>"
        );
        expect(result).toMatchInlineSnapshot(`
            Document {
              "children": Array [
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
              ],
              "endIndex": null,
              "next": null,
              "parent": null,
              "prev": null,
              "startIndex": null,
              "type": "root",
            }
        `);
    });

    it("should be cloneable", () => {
        const result = parse(
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
        const result = parse("<div foo=bar><div><div>");
        expect(result.cloneNode(true)).toEqual(result);
        expect(result.cloneNode(false)).not.toEqual(result);
        expect(result.cloneNode()).toHaveProperty("children", []);
    });

    it("should clone startIndex and endIndex", () => {
        const result = parse("<div foo=bar><div><div>", {
            withStartIndices: true,
            withEndIndices: true,
        }).children[0];
        const clone = result.cloneNode(true);
        expect(clone.startIndex).toBe(0);
        expect(clone.endIndex).toBe(23);
    });

    it("should throw an error when cloning unsupported types", () => {
        const el = new node.Node(ElementType.Doctype);
        expect(() => el.cloneNode()).toThrow("Not implemented yet: doctype");
    });

    it("should detect tag types", () => {
        const result = parse("<div foo=bar><div><div>").children[0];

        expect(node.isTag(result)).toBe(true);
        expect(node.hasChildren(result)).toBe(true);

        expect(node.isCDATA(result)).toBe(false);
        expect(node.isText(result)).toBe(false);
        expect(node.isComment(result)).toBe(false);
        expect(node.isDirective(result)).toBe(false);
        expect(node.isDocument(result)).toBe(false);
    });
});

type Options = DomHandlerOptions & ParserOptions;
function parse(data: string, options: Options = {}): NodeWithChildren {
    const handler = new Handler((err) => {
        if (err) throw err;
    }, options);

    const parser = new Parser(handler, options);

    parser.end(data);

    return handler.root;
}
