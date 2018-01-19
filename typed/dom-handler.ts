import { Tag } from './tag';
import { Text } from './text';
import { DomApi, isTag } from './dom-api';
import { TagLv1 } from './tag-lv1';
import { TextLv1 } from './text-lv1';
import { DomApiLv1 } from './dom-api-lv1';
import { DomApiAbstract, ElementType, appendString } from './dom-api-abstract';

export declare type DomType = DomApi | DomApiLv1;

export interface DomCallBack {
  (err: Error, dom: DomType[]): void;
}

export interface ElementCB {
  (elem: DomApiAbstract): void;
}

export interface Options {
  normalizeWhitespace?: boolean; // Replace all whitespace with single spaces
  withStartIndices?: boolean; // Add startIndex properties to nodes
  withEndIndices?: boolean; // Add endIndex properties to nodes
  ignoreWhitespace?: boolean;
  withDomLvl1?: boolean;
}

// default options
const defaultOpts = {
  normalizeWhitespace: false, // Replace all whitespace with single spaces
  withStartIndices: false, // Add startIndex properties to nodes
  withEndIndices: false, // Add endIndex properties to nodes
};

export class DomHandler {
  private readonly _options: Options;
  private readonly _callback: DomCallBack;
  private readonly _elementCB: ElementCB;
  private _parser: any;
  public readonly doms: DomType[];
  public readonly _tagStack: DomApiAbstract[];
  public _done: boolean;

  constructor(callback: DomCallBack | Options, options?: Options | ElementCB, elementCB?: ElementCB) {
    if (typeof callback === 'object') {
      this._options = callback;
      this._elementCB = options as ElementCB;
      this._callback = null;
    } else if (typeof options === 'function') {
      this._elementCB = options;
      this._options = defaultOpts;
      this._callback = callback;
    } else {
      this._callback = callback;
      this._options = options;
      this._elementCB = elementCB;
    }
    this.doms = [];
    this._done = false;
    this._tagStack = [];
    // console.log(this, typeof callback, typeof options);
    this._parser = this._parser || null;
  }

  public onparserinit(parser: any): void {
    this._parser = parser;
  }

  // Resets the handler back to starting state
  public onreset(): void {
    this.doms.splice(0, this.doms.length);
    this._done = false;
    this._tagStack.splice(0, this._tagStack.length);
  }

  // Signals the handler that parsing is done
  public onend(): void {
    if (this._done) { return; }
    this._done = true;
    this._parser = null;
    this._handleCallback(null);
  }

  public onerror(error: Error): void {
    if (typeof this._callback === 'function') {
      this._callback(error, this.doms);
    } else {
      if (error) { throw error; }
    }
  }
  private _handleCallback(error: Error): void {
    this.onerror(error);
  }

  public onclosetag(): void {
    // if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
    const elem = this._tagStack.pop();
    elem._endindex(this._parser.endIndex);
    if (this._elementCB) { this._elementCB(elem); }
  }

  private _createDomElement(properties: any): DomApiAbstract {
    // console.log(this._options, properties);
    if (this._options.withDomLvl1) {
      if (isTag(properties.type) || isTag(properties.name)) {
        return new TagLv1(properties);
      } else {
        return new TextLv1(properties);
      }
    }
    if (isTag(properties.type) || isTag(properties.name)) {
      return new Tag(properties);
    } else {
      return new Text(properties);
    }
  }

  private _addDomElement(element: DomApiAbstract): void {
    const parent = this._tagStack[this._tagStack.length - 1];
    const siblings = parent ? parent._children(true) : this.doms;
    const previousSibling = siblings[siblings.length - 1];

    element._next(null);
    if (element instanceof Tag || element instanceof Text) {
      if (this._options.withStartIndices) {
        element.startIndex = this._parser.startIndex;
      }
      if (this._options.withEndIndices) {
        element.endIndex = this._parser.endIndex;
      }
    }

    if (previousSibling) {
      element._prev(previousSibling);
      previousSibling._next(element);
    } else {
      element._prev(null);
    }
    // console.log(element);
    siblings.push(element);
    if (parent) {
      parent._firstChild(siblings[0]);
      parent._lastChild(siblings[siblings.length - 1]);
    }
    element._parent(parent || null);
  }

  public onopentag(name: string, attribs: any): void {
    let properties: DomType;
    if (this._options.withDomLvl1) {
      properties = new TagLv1({
        type: name === ElementType.Script ? ElementType.Script :
          (name === ElementType.Style ? ElementType.Style : ElementType.Tag),
        tagName: name,
        attribs: attribs,
        children: null
      });
    } else {
      properties = new Tag({
        type: name === ElementType.Script ? ElementType.Script :
          (name === ElementType.Style ? ElementType.Style : ElementType.Tag),
        name: name,
        attribs: attribs,
        children: []
      });
    }

    const element = this._createDomElement(properties);
    this._addDomElement(element);
    this._tagStack.push(element);
  }

  public ontext(data: any): void {
    // the ignoreWhitespace is officially dropped, but for now,
    // it's an alias for normalizeWhitespace
    const normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

    let lastTag: DomApiAbstract; // = this.doms[this.doms.length - 1];
    // console.log(lastTag, data);
    if (this._tagStack.length == 0 && this.doms.length > 0) {
      lastTag = this.doms[this.doms.length - 1];
      if (lastTag.type === ElementType.Text) {
        lastTag._data(data, normalize);
        return;
      }
    }
    if (this._tagStack.length > 0) {
      lastTag = this._tagStack[this._tagStack.length - 1];
      if (lastTag) {
        const children = lastTag._children(false) || [];
        lastTag = children[children.length - 1];
      }
    }
    if (lastTag && lastTag.type === ElementType.Text) {
      lastTag._data(data, normalize);
    } else {
      const element = this._createDomElement({
        data: appendString('', data, normalize),
        type: ElementType.Text
      });
      this._addDomElement(element);
    }
  }

  public oncomment(data: any): void {
    const lastTag = this._tagStack[this._tagStack.length - 1];
    // console.log(lastTag, data);
    if (lastTag && lastTag.type === ElementType.Comment && lastTag instanceof Text) {
      lastTag.data += data;
      return;
    }
    const properties = {
      data: data,
      type: ElementType.Comment
    };
    // console.log(`open:comment`);
    const element = this._createDomElement(properties);
    this._addDomElement(element);
    this._tagStack.push(element);
  }

  public oncommentend(): void {
    // console.log(`end:comment`);
    this._tagStack.pop();
  }

  public oncdatastart(): void {
    const properties = {
      children: [this._createDomElement({
        data: '',
        type: ElementType.Text
      })],
      type: ElementType.CDATA
    };
    const element = this._createDomElement(properties);
    this._addDomElement(element);
    this._tagStack.push(element);
  }

  public oncdataend(): void {
    this._tagStack.pop();
  }

  public onprocessinginstruction(name: string, data: any): void {
    const element = this._createDomElement({
      name: name,
      data: data,
      type: ElementType.Directive
    });
    this._addDomElement(element);
  }
}
