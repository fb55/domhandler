// // DOM-Level-1-compliant structure
import { DomApi } from './dom-api';

export class Text extends DomApi {
  public data: string;
  public readonly name?: string;
  public attribs: any;

  constructor(props: any) {
    super(props.type, props.children || []);
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

}
