

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

export interface DomApiAbstract {
  type: ElementType;
  _children(): any[];
  _parent(next: DomApiAbstract): void;
  _next(next: DomApiAbstract): void;
  _prev(next: DomApiAbstract): void;
  _endindex(idx: number): void;
  _startindex(idx: number): void;
}
