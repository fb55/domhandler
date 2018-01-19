import { DomApiAbstract, ElementType, appendString } from './dom-api-abstract';

export enum NodeTypes {
  element = 1,
  text = 3,
  cdata = 4,
  comment = 8
}

export function nodeTypeValue(key: string): number {
  return (NodeTypes as any)[key] || NodeTypes.element;
}

export class DomApiLv1 implements DomApiAbstract {
  public type: ElementType;
  public tagName?: string;
  public nodeValue?: string;
  public data?: string;
  public nodeType: NodeTypes;
  public children: DomApiLv1[];
  public firstChild: DomApiLv1;
  public lastChild: DomApiLv1;
  public prev?: DomApiLv1;
  public previousSibling?: DomApiLv1;
  public next?: DomApiLv1;
  public nextSibling?: DomApiLv1;

  constructor(type: ElementType, children: DomApiLv1[]) {
    this.type = type;
    this.nodeType = nodeTypeValue(this.type);
    if (children) {
      this.children = children;
    }
    this.firstChild = null;
    this.lastChild = null;
  }

  public _children(modify: boolean): DomApiLv1[] {
    if (modify && !this.children) {
      this.children = [];
    }
    return this.children;
  }

  public _firstChild(fc: DomApiLv1): void {
    if (fc !== this) {
      this.firstChild = fc;
    } else {
      this.firstChild = null;
    }
  }

  public _lastChild(fc: DomApiLv1): void {
    if (fc !== this) {
      this.lastChild = fc;
    } else {
      this.lastChild = null;
    }
  }

  public _data(str: string, normalize: boolean): void {
    this.data = this.nodeValue = appendString(this.nodeValue, str, normalize);
  }

  public _lastChildren(): DomApiLv1 {
    return this.children && this.children[this.children.length - 1];
  }

  public _endindex(): void {
    return;
  }

  public _startindex(): void {
    return;
  }

  public _parent(): void {
    return;
  }

  public _next(p: DomApiLv1): void {
    this.next = p;
    this.nextSibling = p;
  }

  public _prev(p: DomApiLv1): void {
    this.prev = p;
    this.previousSibling = p;
  }

}
