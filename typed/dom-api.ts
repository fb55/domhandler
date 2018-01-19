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

export function isTag(type: string): boolean {
  return type === ElementType.Tag ||
         type === ElementType.Script ||
         type === ElementType.Style;
}

export abstract class DomApi implements DomApiAbstract {
  public type: ElementType;
  public name?: string;
  public next?: DomApi;
  public prev?: DomApi;
  public parent?: DomApi;
  public startIndex?: number;
  public endIndex?: number;
  public children?: DomApi[];

  public _endindex(idx: number): void {
    this.endIndex = idx;
  }

  public _startindex(idx: number): void {
    this.startIndex = idx;
  }

  public _next(idx: DomApi): void {
    this.next = idx;
  }

  public _prev(idx: DomApi): void {
    this.prev = idx;
  }

  public _parent(idx: DomApi): void {
    this.parent = idx;
  }

  public _children(): DomApi[] {
    return this.children;
  }
}
