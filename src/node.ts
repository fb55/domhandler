import { ElementType } from "domelementtype";

const nodeTypes = new Map<ElementType, number>([
    [ElementType.Tag, 1],
    [ElementType.Script, 1],
    [ElementType.Style, 1],
    [ElementType.Directive, 1],
    [ElementType.Text, 3],
    [ElementType.CDATA, 4],
    [ElementType.Comment, 8],
    [ElementType.Root, 9],
]);

/**
 * This object will be used as the prototype for Nodes when creating a
 * DOM-Level-1-compliant structure.
 */
export class Node {
    /** Parent of the node */
    parent: NodeWithChildren | null = null;

    /** Previous sibling */
    prev: Node | null = null;

    /** Next sibling */
    next: Node | null = null;

    /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
    startIndex: number | null = null;

    /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
    endIndex: number | null = null;

    /**
     *
     * @param type The type of the node.
     */
    constructor(public type: ElementType) {}

    // Read-only aliases
    get nodeType(): number {
        return nodeTypes.get(this.type) ?? 1;
    }

    // Read-write aliases for properties
    get parentNode(): NodeWithChildren | null {
        return this.parent;
    }

    set parentNode(parent: NodeWithChildren | null) {
        this.parent = parent;
    }

    get previousSibling(): Node | null {
        return this.prev;
    }

    set previousSibling(prev: Node | null) {
        this.prev = prev;
    }

    get nextSibling(): Node | null {
        return this.next;
    }

    set nextSibling(next: Node | null) {
        this.next = next;
    }

    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    cloneNode(recursive = false): Node {
        return cloneNode(this, recursive);
    }
}

export class DataNode extends Node {
    /**
     * @param type The type of the node
     * @param data The content of the data node
     */
    constructor(
        type: ElementType.Comment | ElementType.Text | ElementType.Directive,
        public data: string
    ) {
        super(type);
    }

    get nodeValue(): string {
        return this.data;
    }

    set nodeValue(data: string) {
        this.data = data;
    }
}

export class Text extends DataNode {
    constructor(data: string) {
        super(ElementType.Text, data);
    }
}

export class Comment extends DataNode {
    constructor(data: string) {
        super(ElementType.Comment, data);
    }
}

export class ProcessingInstruction extends DataNode {
    constructor(public name: string, data: string) {
        super(ElementType.Directive, data);
    }

    "x-name"?: string;
    "x-publicId"?: string;
    "x-systemId"?: string;
}

/**
 * A `Node` that can have children.
 */
export class NodeWithChildren extends Node {
    /**
     * @param type Type of the node.
     * @param children Children of the node. Only certain node types can have children.
     */
    constructor(
        type:
            | ElementType.Root
            | ElementType.CDATA
            | ElementType.Script
            | ElementType.Style
            | ElementType.Tag,
        public children: Node[]
    ) {
        super(type);
    }

    // Aliases
    get firstChild(): Node | null {
        return this.children[0] ?? null;
    }

    get lastChild(): Node | null {
        return this.children.length > 0
            ? this.children[this.children.length - 1]
            : null;
    }

    get childNodes(): Node[] {
        return this.children;
    }

    set childNodes(children: Node[]) {
        this.children = children;
    }
}

export class Document extends NodeWithChildren {
    constructor(children: Node[]) {
        super(ElementType.Root, children);
    }

    "x-mode"?: "no-quirks" | "quirks" | "limited-quirks";
}

interface Attribute {
    name: string;
    value: string;
    namespace?: string;
    prefix?: string;
}
export class Element extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(
        public name: string,
        public attribs: { [name: string]: string },
        children: Node[] = [],
        type:
            | ElementType.Tag
            | ElementType.Script
            | ElementType.Style = name === "script"
            ? ElementType.Script
            : name === "style"
            ? ElementType.Style
            : ElementType.Tag
    ) {
        super(type, children);
    }

    // DOM Level 1 aliases
    get tagName(): string {
        return this.name;
    }

    set tagName(name: string) {
        this.name = name;
    }

    get attributes(): Attribute[] {
        return Object.keys(this.attribs).map((name) => ({
            name,
            value: this.attribs[name],
            namespace: this["x-attribsNamespace"]?.[name],
            prefix: this["x-attribsPrefix"]?.[name],
        }));
    }

    "x-attribsNamespace"?: Record<string, string>;
    "x-attribsPrefix"?: Record<string, string>;
}

/**
 * Clone a node, and optionally its children.
 *
 * @param recursive Clone child nodes as well.
 * @returns A clone of the node.
 */
export function cloneNode(node: Node, recursive = false): Node {
    let result;

    switch (node.type) {
        case ElementType.Text:
            result = new Text((node as Text).data);
            break;
        case ElementType.Directive: {
            const instr = node as ProcessingInstruction;
            result = new ProcessingInstruction(instr.name, instr.data);

            if (instr["x-name"] != null) {
                result["x-name"] = instr["x-name"];
                result["x-publicId"] = instr["x-publicId"];
                result["x-systemId"] = instr["x-systemId"];
            }

            break;
        }
        case ElementType.Comment:
            result = new Comment((node as Comment).data);
            break;
        case ElementType.Tag:
        case ElementType.Script:
        case ElementType.Style: {
            const elem = node as Element;
            const children = recursive ? cloneChildren(elem.children) : [];
            const clone = new Element(elem.name, { ...elem.attribs }, children);
            children.forEach((child) => (child.parent = clone));

            if (elem["x-attribsNamespace"]) {
                clone["x-attribsNamespace"] = { ...elem["x-attribsNamespace"] };
            }
            if (elem["x-attribsPrefix"]) {
                clone["x-attribsPrefix"] = { ...elem["x-attribsPrefix"] };
            }

            result = clone;
            break;
        }
        case ElementType.CDATA: {
            const cdata = node as NodeWithChildren;
            const children = recursive ? cloneChildren(cdata.children) : [];
            const clone = new NodeWithChildren(node.type, children);
            children.forEach((child) => (child.parent = clone));
            result = clone;
            break;
        }
        case ElementType.Root: {
            const doc = node as Document;
            const children = recursive ? cloneChildren(doc.children) : [];
            const clone = new Document(children);
            children.forEach((child) => (child.parent = clone));

            if (doc["x-mode"]) {
                clone["x-mode"] = doc["x-mode"];
            }

            result = clone;
            break;
        }
        case ElementType.Doctype: {
            // This type isn't used yet.
            throw new Error("Not implemented yet: ElementType.Doctype case");
        }
    }

    result.startIndex = node.startIndex;
    result.endIndex = node.endIndex;
    return result;
}

function cloneChildren(childs: Node[]): Node[] {
    const children = childs.map((child) => cloneNode(child, true));

    for (let i = 1; i < children.length; i++) {
        children[i].prev = children[i - 1];
        children[i - 1].next = children[i];
    }

    return children;
}
