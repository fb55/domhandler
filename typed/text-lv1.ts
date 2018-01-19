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
import { DomApiLv1 } from './dom-api-lv1';

export class TextLv1 extends DomApiLv1 {
  public readonly type: ElementType;
  public readonly tagName?: string;
  public readonly nodeValue?: string;
  public readonly childNodes: DomApiLv1[];
  public readonly firstChild: DomApiLv1;
  public readonly lastChild: DomApiLv1;

  private attribs?: any;

  constructor(props: any) {
    super();
    this.type = props.type;
    this.childNodes = props.childNodes || null;
    this.tagName = props.tagName;
    this.nodeValue = props.nodeValue;
  }
}
