import { ElementType } from "domelementtype";
import { Parser, type ParserOptions } from "htmlparser2";
import { describe, expect, it } from "vitest";
import Handler, {
    type DomHandlerOptions,
    type NodeWithChildren,
} from "./index.js";
import * as node from "./node.js";

describe("Nodes", () => {
    it("should serialize to a Jest snapshot", () => {
        const result = parse(
            "<html><!-- A Comment --><title>The Title</title><body>Hello world<input disabled type=text></body></html>",
        );
        expect(result).toMatchInlineSnapshot(`
            Document {
              "children": [
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
            </html>`,
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
        class Doctype extends node.Node {
            type = ElementType.Doctype;
            nodeType = Number.NaN;
            nodeName = "doctype";
        }
        const element = new Doctype();
        expect(() => element.cloneNode()).toThrow(
            "Not implemented yet: doctype",
        );
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

    it("should support using tagged types", () => {
        // We want to make sure TS is happy about the tagged types.
        const parent: node.ParentNode = new node.Document([]);

        function setQuirks(element: node.ParentNode): void {
            if (element.type === ElementType.Root) {
                element["x-mode"] = "no-quirks";
            }
        }

        setQuirks(parent);

        expect(parent).toHaveProperty("x-mode", "no-quirks");
    });

    it("should expose DOM nodeName aliases", () => {
        const text = new node.Text("text");
        const comment = new node.Comment("comment");
        const cdata = new node.CDATA([text]);
        const document = new node.Document([cdata]);
        const directive = new node.ProcessingInstruction("xml", "?xml");
        const element = new node.Element("div", {});

        expect(text.nodeName).toBe("#text");
        expect(comment.nodeName).toBe("#comment");
        expect(cdata.nodeName).toBe("#cdata-section");
        expect(document.nodeName).toBe("#document");
        expect(directive.nodeName).toBe("xml");
        expect(element.nodeName).toBe("div");
    });
});

type Options = DomHandlerOptions & ParserOptions;
function parse(data: string, options: Options = {}): NodeWithChildren {
    const handler = new Handler((error) => {
        if (error) throw error;
    }, options);

    const parser = new Parser(handler, options);

    parser.end(data);

    return handler.root;
}
