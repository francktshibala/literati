// Fix for parse5 TypeScript compilation issue
declare module 'parse5' {
  export * from 'parse5/dist/index';
}

declare module 'parse5/dist/index' {
  // Minimal type declarations to bypass the syntax error
  export interface Node {
    nodeName: string;
    [key: string]: any;
  }
  
  export interface Element extends Node {
    tagName: string;
    attrs: Array<{ name: string; value: string }>;
    children: Node[];
  }
  
  export interface Document extends Node {
    children: Node[];
  }
  
  export function parse(html: string, options?: any): Document;
  export function parseFragment(html: string, options?: any): Node[];
  export function serialize(node: Node, options?: any): string;
}