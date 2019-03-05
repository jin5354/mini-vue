interface RegExpConstructor {
  leftContext: string,
  rightContext: string
}

interface ASTElementData {
  key? : string,
  ref? : string,
  events?: {
    [key: string]: any
  },
  attrs?: {
    [key: string]: any
  },
  rawAttrs?: {
    [key: string]: any
  },
  directives?: {
    [key: string]: any
  }
}

interface ASTRoot {
  children: ASTElement[]
}

interface ASTElement {
  type: 'Element' | 'Text' | 'Comment',
  children: ASTElement[],
  tag: string,
  text: string,
  data: ASTElementData | null,
  parent: ASTElement | ASTRoot,
  ifProcessed?: boolean,
  forProcessed?: boolean
}

interface VNodeData {
  key?: string,
  ref?: string,
  events?: {
    [key: string]: any
  },
  attrs?: {
    [key: string]: any
  },
  props?: {
    [key: string]: any
  },
  rawAttrs?: {
    [key: string]: any
  },
  directives?: {
    [key: string]: any
  }
}

interface VNode {
  type?: 'Element' | 'Text' | 'Comment',
  tag?: string,
  data?: VNodeData,
  children?: Array<VNode>,
  text?: string,
  elm?: Node
}