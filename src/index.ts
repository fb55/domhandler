import { ElementType } from "domelementtype";
import {
    ChildNode,
    Element,
    DataNode,
    Text,
    Comment,
    CDATA,
    Document,
    ProcessingInstruction,
    ParentNode,
} from "./node.js";

export * from "./node.js";

export interface DomHandlerOptions {
    /**
     * Add a `startIndex` property to nodes.
     * When the parser is used in a non-streaming fashion, `startIndex` is an integer
     * indicating the position of the start of the node in the document.
     *
     * @default false
     */
    withStartIndices?: boolean;

    /**
     * Add an `endIndex` property to nodes.
     * When the parser is used in a non-streaming fashion, `endIndex` is an integer
     * indicating the position of the end of the node in the document.
     *
     * @default false
     */
    withEndIndices?: boolean;

    /**
     * Treat the markup as XML.
     *
     * @default false
     */
    xmlMode?: boolean;
}

// Default options
const defaultOpts: DomHandlerOptions = {
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

export class DomHandler {
    /** The elements of the DOM */
    public dom: ChildNode[] = [];

    /** The root element for the DOM */
    public root = new Document(this.dom);

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
    public constructor(
        callback?: Callback | null,
        options?: DomHandlerOptions | null,
        elementCB?: ElementCallback
    ) {
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOpts;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }

        this.callback = callback ?? null;
        this.options = options ?? defaultOpts;
        this.elementCB = elementCB ?? null;
    }

    public onparserinit(parser: ParserInterface): void {
        this.parser = parser;
    }

    // Resets the handler back to starting state
    public onreset(): void {
        this.dom = [];
        this.root = new Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
    }

    // Signals the handler that parsing is done
    public onend(): void {
        if (this.done) return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
    }

    public onerror(error: Error): void {
        this.handleCallback(error);
    }

    public onclosetag(): void {
        this.lastNode = null;

        const elem = this.tagStack.pop() as Element;

        if (this.options.withEndIndices) {
            elem.endIndex = this.parser!.endIndex;
        }

        if (this.elementCB) this.elementCB(elem);
    }

    public onopentag(name: string, attribs: { [key: string]: string }): void {
        const type = this.options.xmlMode ? ElementType.Tag : undefined;
        const element = new Element(name, attribs, undefined, type);
        this.addNode(element);
        this.tagStack.push(element);
    }

    public ontext(data: string): void {
        const { lastNode } = this;

        if (lastNode && lastNode.type === ElementType.Text) {
            lastNode.data += data;
            if (this.options.withEndIndices) {
                lastNode.endIndex = this.parser!.endIndex;
            }
        } else {
            const node = new Text(data);
            this.addNode(node);
            this.lastNode = node;
        }
    }

    public oncomment(data: string): void {
        if (this.lastNode && this.lastNode.type === ElementType.Comment) {
            this.lastNode.data += data;
            return;
        }

        const node = new Comment(data);
        this.addNode(node);
        this.lastNode = node;
    }

    public oncommentend(): void {
        this.lastNode = null;
    }

    public oncdatastart(): void {
        const text = new Text("");
        const node = new CDATA([text]);

        this.addNode(node);

        text.parent = node;
        this.lastNode = text;
    }

    public oncdataend(): void {
        this.lastNode = null;
    }

    public onprocessinginstruction(name: string, data: string): void {
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

        if (this.options.withStartIndices) {
            node.startIndex = this.parser!.startIndex;
        }

        if (this.options.withEndIndices) {
            node.endIndex = this.parser!.endIndex;
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
