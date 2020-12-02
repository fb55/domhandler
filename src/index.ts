import { ElementType } from "domelementtype";
import {
    Node,
    Element,
    DataNode,
    Text,
    Comment,
    NodeWithChildren,
    ProcessingInstruction,
} from "./node";

export * from "./node";

const reWhitespace = /\s+/g;

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
     * Replace all whitespace with single spaces.
     *
     * **Note:** Enabling this might break your markup.
     *
     * @default false
     * @deprecated
     */
    normalizeWhitespace?: boolean;
}

// Default options
const defaultOpts: DomHandlerOptions = {
    normalizeWhitespace: false,
    withStartIndices: false,
    withEndIndices: false,
};

interface ParserInterface {
    startIndex: number | null;
    endIndex: number | null;
}

type Callback = (error: Error | null, dom: Node[]) => void;
type ElementCallback = (element: Element) => void;

export class DomHandler {
    /** The elements of the DOM */
    public dom: Node[] = [];

    /** The root element for the DOM */
    public root = new NodeWithChildren(ElementType.Root, this.dom);

    /** Called once parsing has completed. */
    private readonly _callback: Callback | null;

    /** Settings for the handler. */
    private readonly _options: DomHandlerOptions;

    /** Callback whenever a tag is closed. */
    private readonly _elementCB: ElementCallback | null;

    /** Indicated whether parsing has been completed. */
    private _done = false;

    /** Stack of open tags. */
    private _tagStack: NodeWithChildren[] = [this.root];

    /** A data node that is still being written to. */
    private _lastNode: DataNode | null = null;

    /** Reference to the parser instance. Used for location information. */
    private _parser: ParserInterface | null = null;

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

        this._callback = callback ?? null;
        this._options = options ?? defaultOpts;
        this._elementCB = elementCB ?? null;
    }

    public onparserinit(parser: ParserInterface): void {
        this._parser = parser;
    }

    // Resets the handler back to starting state
    public onreset(): void {
        this.dom = [];
        this.root = new NodeWithChildren(ElementType.Root, this.dom);
        this._done = false;
        this._tagStack = [this.root];
        this._lastNode = null;
        this._parser = this._parser ?? null;
    }

    // Signals the handler that parsing is done
    public onend(): void {
        if (this._done) return;
        this._done = true;
        this._parser = null;
        this.handleCallback(null);
    }

    public onerror(error: Error): void {
        this.handleCallback(error);
    }

    public onclosetag(): void {
        this._lastNode = null;

        const elem = this._tagStack.pop() as Element;

        if (elem.type === ElementType.Root) throw new Error("woot");

        if (this._options.withEndIndices) {
            elem.endIndex = this._parser!.endIndex;
        }

        if (this._elementCB) this._elementCB(elem);
    }

    public onopentag(name: string, attribs: { [key: string]: string }): void {
        const element = new Element(name, attribs);
        this.addNode(element);
        this._tagStack.push(element);
    }

    public ontext(data: string): void {
        const normalize = this._options.normalizeWhitespace;

        const { _lastNode } = this;

        if (_lastNode && _lastNode.type === ElementType.Text) {
            if (normalize) {
                _lastNode.data = (_lastNode.data + data).replace(
                    reWhitespace,
                    " "
                );
            } else {
                _lastNode.data += data;
            }
        } else {
            if (normalize) {
                data = data.replace(reWhitespace, " ");
            }

            const node = new Text(data);
            this.addNode(node);
            this._lastNode = node;
        }
    }

    public oncomment(data: string): void {
        if (this._lastNode && this._lastNode.type === ElementType.Comment) {
            this._lastNode.data += data;
            return;
        }

        const node = new Comment(data);
        this.addNode(node);
        this._lastNode = node;
    }

    public oncommentend(): void {
        this._lastNode = null;
    }

    public oncdatastart(): void {
        const text = new Text("");
        const node = new NodeWithChildren(ElementType.CDATA, [text]);

        this.addNode(node);

        text.parent = node;
        this._lastNode = text;
    }

    public oncdataend(): void {
        this._lastNode = null;
    }

    public onprocessinginstruction(name: string, data: string): void {
        const node = new ProcessingInstruction(name, data);
        this.addNode(node);
    }

    protected handleCallback(error: Error | null): void {
        if (typeof this._callback === "function") {
            this._callback(error, this.dom);
        } else if (error) {
            throw error;
        }
    }

    protected addNode(node: Node): void {
        const parent = this._tagStack[this._tagStack.length - 1];
        this._tagStack.length < 2 &&
            (console.log(this._tagStack.length),
            console.log(this._tagStack[0].type));
        const siblings = parent.children;
        const previousSibling = siblings[siblings.length - 1] as
            | Node
            | undefined;

        if (this._options.withStartIndices) {
            node.startIndex = this._parser!.startIndex;
        }

        if (this._options.withEndIndices) {
            node.endIndex = this._parser!.endIndex;
        }

        siblings.push(node);

        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }

        node.parent = parent;
        this._lastNode = null;
    }

    protected addDataNode(node: DataNode): void {
        this.addNode(node);
        this._lastNode = node;
    }
}

export default DomHandler;
