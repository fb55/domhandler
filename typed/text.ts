// // DOM-Level-1-compliant structure
// var NodePrototype = require('./node');
// var ElementPrototype = module.exports = Object.create(NodePrototype);

// var domLvl1 = {
// 	tagName: "name"
// };

// Object.keys(domLvl1).forEach(function(key) {
// 	var shorthand = domLvl1[key];
// 	Object.defineProperty(ElementPrototype, key, {
// 		get: function() {
// 			return this[shorthand] || null;
// 		},
// 		set: function(val) {
// 			this[shorthand] = val;
// 			return val;
// 		}
// 	});
// });
import { ElementType } from './dom-api-abstract';
import { DomApi } from './dom-api';

export class Text extends DomApi {
  public readonly children: DomApi[];
  public readonly type: ElementType;
  public data: string;
  public readonly name?: string;

  private attribs?: any;

  constructor(props: any) {
    super();
    this.type = props.type;
    this.children = props.children || [];
    if (props.name) {
      this.name = props.name;
    }
    if (props.attribs) {
      this.attribs = props.attribs;
    }
    this.data = props.data;
  }

  public setAttribute(key: string, attr: string): void {
    // throw 'setAttribute is not implemented on Element';
  }

  public _children(): DomApi[] {
    return this.children;
  }
}
