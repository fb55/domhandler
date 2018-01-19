// This object will be used as the prototype for Nodes when creating a
// DOM-Level-1-compliant structure.

import { ElementType } from './dom-api-abstract';
import { DomApi } from './dom-api';
// import { Tag } from './tr';

// export enum domLvl1 {
//   tagName = 'name',
//   childNodes = 'children',
//   parentNode = 'parent',
//   previousSibling = 'prev',
//   nextSibling = 'next',
//   nodeValue = 'data'
// }

// export enum ElementType {
//   Script,
//   Style,
//   Tag
// }

export interface NodeParam {
  type: ElementType;
  name: string;
  attribs: any;
  children: DomApi[];
}

export class Tag extends DomApi {
  public readonly children: DomApi[];
  public readonly type: ElementType;
  public readonly name: string;

  private attribs: any; // Map<string, any>;

  constructor(np: NodeParam) {
    super(np.type, np.children || []);
    this.name = np.name;
    this.attribs = {}; // new Map<string, any>();
    for (let key in np.attribs) {
      if (np.attribs.hasOwnProperty(key)) {
        this.setAttribute(key, np.attribs[key]);
      }
    }
  }

  public setAttribute(key: string, attr: string): void {
    // this.attribs.set(key, attr);
    this.attribs[key] = attr;
    const tmp = this as any;
    tmp[key] = tmp[key] || attr;
  }

  public _children(): DomApi[] {
    return this.children;
  }

  // public nodeType(): string {
  //   // return NodeTypes[this.type] || NodeTypes.element;
  // }
}

// Object.keys(domLvl1).forEach(function (key) {
//   var shorthand = domLvl1[key];
//   Object.defineProperty(NodePrototype, key, {
//     get: function () {
//       return this[shorthand] || null;
//     },
//     set: function (val) {
//       this[shorthand] = val;
//       return val;
//     }
//   });
