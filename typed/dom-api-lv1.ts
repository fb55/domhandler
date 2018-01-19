import { DomApiAbstract, ElementType } from './dom-api-abstract';

export enum NodeTypes {
  element = 1,
  text = 3,
  cdata = 4,
  comment = 8
}

export function nodeTypeValue(key: string): number {
  if (Object.keys(NodeTypes).find(nt => nt == key)) {
    // 
  }
  return NodeTypes.element;
}

export class DomApiLv1 implements DomApiAbstract {
  public type: ElementType;
  public tagName?: string;
  public nodeValue?: string;
  public childNodes: DomApiLv1[];

  public get firstChild(): DomApiLv1 {
    const children = this.childNodes;
    return (children && children[0]) || null;
  }

  public get lastChild(): DomApiLv1 {
    const children = this.childNodes;
    return (children && children[children.length - 1]) || null;
  }

  public get nodeType(): NodeTypes {
    return nodeTypeValue(this.type);
  }

  public _children(): DomApiLv1[] {
    return this.childNodes;
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

  public _next(): void {
    return;
  }

  public _prev(): void {
    return;
  }

}
