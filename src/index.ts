import { ElementType } from "domelementtype";
import {
    CDATA,
    type ChildNode,
    Comment,
    type DataNode,
    Document,
    Element,
    type ParentNode,
    ProcessingInstruction,
    Text,
} from "./node.js";

export * from "./node.js";

/**
 * Configuration options for `DomHandler`.
 */
export interface DomHandlerOptions {
    /**
     * Add a `startIndex` property to nodes.
     * When the parser is used in a non-streaming fashion, `startIndex` is an integer
     * indicating the position of the start of the node in the document.
     * @default false
     */
    withStartIndices?: boolean;

    /**
     * Add an `endIndex` property to nodes.
     * When the parser is used in a non-streaming fashion, `endIndex` is an integer
     * indicating the position of the end of the node in the document.
     * @default false
     */
    withEndIndices?: boolean;

    /**
     * Treat the markup as XML.
     * @default false
     */
    xmlMode?: boolean;
}

// Default options
const defaultOptions: DomHandlerOptions = {
    withStartIndices: false,
    withEndIndices: false,
    xmlMode: false,
};

interface ParserInterface {
    startIndex: number | null;
    endIndex: number | null;
}

type Callback = (error: Error | null, dom: ChildNode[]) => void;
type ElementCallback = (element: Element) => void;

/**
 * Event-based handler that builds a DOM tree from parser callbacks.
 */
export class DomHandler {
    /** The elements of the DOM */
    dom: ChildNode[] = [];

    /** The root element for the DOM */
    root: Document = new Document(this.dom);

    /** Called once parsing has completed. */
    private readonly callback: Callback | null;

    /** Settings for the handler. */
    private readonly options: DomHandlerOptions;

    /** Callback whenever a tag is closed. */
    private readonly elementCB: ElementCallback | null;

    /** Indicated whether parsing has been completed. */
    private done = false;

    /** Stack of open tags. */
    protected tagStack: ParentNode[] = [this.root];

    /** A data node that is still being written to. */
    protected lastNode: DataNode | null = null;

    /** Reference to the parser instance. Used for location information. */
    private parser: ParserInterface | null = null;

    /**
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */
    constructor(
        callback?: Callback | null,
        options?: DomHandlerOptions | null,
        elementCB?: ElementCallback,
    ) {
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOptions;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }

        this.callback = callback ?? null;
        this.options = options ?? defaultOptions;
        this.elementCB = elementCB ?? null;
    }

    onparserinit(parser: ParserInterface): void {
        this.parser = parser;
    }

    // Resets the handler back to starting state
    onreset(): void {
        this.dom = [];
        this.root = new Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
    }

    // Signals the handler that parsing is done
    onend(): void {
        if (this.done) return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
    }

    onerror(error: Error): void {
        this.handleCallback(error);
    }

    onclosetag(): void {
        this.lastNode = null;

        const element = this.tagStack.pop() as Element;

        if (this.options.withEndIndices && this.parser) {
            element.endIndex = this.parser.endIndex;
        }

        if (this.elementCB) this.elementCB(element);
    }

    onopentag(name: string, attribs: { [key: string]: string }): void {
        const type = this.options.xmlMode ? ElementType.Tag : undefined;
        const element = new Element(name, attribs, undefined, type);
        this.addNode(element);
        this.tagStack.push(element);
    }

    ontext(data: string): void {
        const { lastNode } = this;

        if (lastNode && lastNode.type === ElementType.Text) {
            lastNode.data += data;
            if (this.options.withEndIndices && this.parser) {
                lastNode.endIndex = this.parser.endIndex;
            }
        } else {
            const node = new Text(data);
            this.addNode(node);
            this.lastNode = node;
        }
    }

    oncomment(data: string): void {
        if (this.lastNode && this.lastNode.type === ElementType.Comment) {
            this.lastNode.data += data;
            return;
        }

        const node = new Comment(data);
        this.addNode(node);
        this.lastNode = node;
    }

    oncommentend(): void {
        this.lastNode = null;
    }

    oncdatastart(): void {
        const text = new Text("");
        const node = new CDATA([text]);

        this.addNode(node);

        text.parent = node;
        this.lastNode = text;
    }

    oncdataend(): void {
        this.lastNode = null;
    }

    onprocessinginstruction(name: string, data: string): void {
        const node = new ProcessingInstruction(name, data);
        this.addNode(node);
    }

    protected handleCallback(error: Error | null): void {
        if (typeof this.callback === "function") {
            this.callback(error, this.dom);
        } else if (error) {
            throw error;
        }
    }

    protected addNode(node: ChildNode): void {
        const parent = this.tagStack[this.tagStack.length - 1];
        const previousSibling = parent.children[parent.children.length - 1] as
            | ChildNode
            | undefined;

        if (this.options.withStartIndices && this.parser) {
            node.startIndex = this.parser.startIndex;
        }

        if (this.options.withEndIndices && this.parser) {
            node.endIndex = this.parser.endIndex;
        }

        parent.children.push(node);

        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }

        node.parent = parent;
        this.lastNode = null;
    }
}

export default DomHandler;
