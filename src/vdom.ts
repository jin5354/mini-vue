import parse, {ElementNode, TextNode, CommentNode} from 'simp-html-parser'

export {parse}

type VNode = ElementNode | TextNode | CommentNode

// 使用递归构建真实 DOM
export function createDOM(node: VNode) {
  let $node: Node
  if(node instanceof ElementNode) {
    $node = document.createElement(node.tag)
    node.children.forEach(e => {
      $node.appendChild(createDOM(e))
    })
    updateProps($node, node.attrs, [])
  }
  if(node instanceof TextNode) {
    $node = document.createTextNode(node.content)
  }
  if(node instanceof CommentNode) {
    $node = document.createComment(node.content)
  }
  return $node
}

// 根据 virtual DOM 更新真实 DOM
// 进行 DOM diff
// 新增了节点，使用 appendChild(createDOM)
// 移除了节点，使用 removeChild(old)
// 更换了节点，使用 replaceChild(createDOM, old)
// 对于 children，递归进去
export function updateElement($parent: Node, newNode: VNode, oldNode?: VNode, index: number = 0) {
  if(!oldNode) {
    $parent.appendChild(createDOM(newNode))
  }else if(!newNode) {
    $parent.removeChild($parent.childNodes[index])
  }else if(isChangedNode(newNode, oldNode)) {
    $parent.replaceChild(createDOM(newNode), $parent.childNodes[index])
  }else if(newNode instanceof ElementNode && oldNode instanceof ElementNode) {
    let len1 = newNode.children.length
    let len2 = oldNode.children.length
    updateProps($parent.childNodes[index], newNode.attrs, oldNode.attrs)
    for(let i = 0; i < len1 || i < len2; i++) {
      updateElement($parent.childNodes[index], newNode.children[i], oldNode.children[i], i)
    }
  }
}

// 判断 node 是否相同
// 如果 node 类型不同，一定不同
// 如果都是 ElementNode，判断 tag
// 如果都是 TextNode 或者 CommentNode，判断 content
function isChangedNode(node1: VNode, node2: VNode): boolean {
  if(node1.constructor.name !== node2.constructor.name) {
    return true
  }else if(node1 instanceof ElementNode) {
    return node1.tag !== (<ElementNode>node2).tag
  }else if(node1 instanceof TextNode || node1 instanceof CommentNode) {
    return node1.content !== (<TextNode|CommentNode>node2).content
  }
  return false
}

function updateProps($dom, newProps, oldProps): void {
  let newPropsMap = {}
  newProps.forEach(prop => {
    newPropsMap[prop.name] = prop.value
  })
  let oldPropsMap = {}
  oldProps.forEach(prop => {
    oldPropsMap[prop.name] = prop.value
  })
  let props = Object.assign({}, newPropsMap, oldPropsMap)
  Object.keys(props).forEach(name => {
    if(!oldProps[name]) {
      setProp($dom, name, props[name])
    }else if(!newProps[name]) {
      removeProp($dom, name, props[name])
    }else if(newProps[name] !== oldProps[name]) {
      removeProp($dom, name, oldProps[name])
      setProp($dom, name, newProps[name])
    }
  })
}

function setProp($dom, name, value) {
  if(isCustomProp(name)) {
    return
  }else if(typeof value === 'boolean') {
    $dom.setAttribute(name, value)
    $dom[name] = value
  }else {
    $dom.setAttribute(name, value)
  }
}

function removeProp($dom, name, value) {
  if(isCustomProp(name)) {
    return
  }else if(typeof value === 'boolean') {
    $dom.removeAttribute(name)
    $dom[name] = false
  }else {
    $dom.removeAttribute(name)
  }
}

function isCustomProp(name) {
  return false
}