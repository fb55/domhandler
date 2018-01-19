
export enum ElementType {
  Text = 'text', // Text
  Directive = 'directive', // <? ... ?>
  Comment = 'comment', // <!-- ... -->
  Script = 'script', // <script> tags
  Style = 'style', // <style> tags
  Tag = 'tag', // Any tag
  CDATA = 'cdata', // <![CDATA[ ... ]]>
  Doctype = 'doctype'
}

const ReWhitespace = /\s+/g;

export function appendString(prefix: string, suffix: string, normalize: boolean): string {
  const ret = (prefix || '') + suffix;
  if (normalize) {
    return ret.replace(ReWhitespace, ' ');
  }
  return ret;
}

export interface DomApiAbstract {
  type: ElementType;
  _lastChild(fc: DomApiAbstract): void;
  _firstChild(fc: DomApiAbstract): void;
  _children(modify: boolean): DomApiAbstract[];
  _parent(next: DomApiAbstract): void;
  _next(next: DomApiAbstract): void;
  _prev(next: DomApiAbstract): void;
  _endindex(idx: number): void;
  _startindex(idx: number): void;
  _data(str: string, normalize: boolean): void;
}
