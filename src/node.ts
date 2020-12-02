import { ElementType } from "domelementtype";

const nodeTypes = new Map<ElementType, number>([
    [ElementType.Tag, 1],
    [ElementType.Script, 1],
    [ElementType.Style, 1],
    [ElementType.Directive, 1],
    [ElementType.Text, 3],
    [ElementType.CDATA, 4],
    [ElementType.Comment, 8],
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
}

export class NodeWithChildren extends Node {
    /**
     *
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

export class Element extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(
        public name: string,
        public attribs: { [name: string]: string },
        children: Node[] = []
    ) {
        super(
            name === "script"
                ? ElementType.Script
                : name === "style"
                ? ElementType.Style
                : ElementType.Tag,
            children
        );
        this.attribs = attribs;
    }

    // DOM Level 1 aliases
    get tagName(): string {
        return this.name;
    }

    set tagName(name: string) {
        this.name = name;
    }

    get attributes(): { name: string; value: string }[] {
        return Object.keys(this.attribs).map((name) => ({
            name,
            value: this.attribs[name],
        }));
    }
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
            result = clone;
            break;
        }
        case ElementType.Root:
        case ElementType.CDATA: {
            const cdata = node as NodeWithChildren;
            const children = recursive ? cloneChildren(cdata.children) : [];
            const clone = new NodeWithChildren(node.type, children);
            children.forEach((child) => (child.parent = clone));
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
