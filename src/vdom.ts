import MiniVue from './index'

export class VNode {
  type
  tag
  data
  children
  text
  elm
  options

  constructor(
    type?: 'Element' | 'Text' | 'Comment' | 'Component',
    tag?: string,
    data?: VNodeData,
    children?: Array<VNode>,
    text?: string,
    options?: any,
    elm?: Node
  ) {
    this.type = type
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.options = options
  }
}

// 创建节点
export function createElementVNode(type, tag, data, children, text) {
  return new VNode(type, tag, data, children, text)
}

// 创建注释节点
export function createCommentVNode(str: string) {
  let node = new VNode('Comment')
  node.data = {}
  node.text = str
  return node
}

// 创建空白注释节点
export function createEmptyVNode() {
  return createCommentVNode('')
}

// 创建文本节点
export function createTextVNode(str: string) {
  let node = new VNode('Text')
  node.data = {}
  node.text = str
  return node
}

// 创建组件节点
export function createComponentVNode(type, tag, data, children, text, vm) {
  return new VNode(type, tag, data, children, text, vm.$options.components[tag])
}

// patch 入口
// 3种情况：
// old 为 dom 元素，为首次初始化，
// old 为 undefined，为组件初始化，没指定 mount 元素
// old 为 vnode，为已存在 vnode 的更新

export function patch(newVNode, old) {
  console.log('newVnode:', newVNode)
  if(old.nodeType === 1) {
    console.log('进入patch：mount', newVNode, old)
    createDOM(newVNode)
    old.parentElement.replaceChild(newVNode.elm, old)
  }else if(!old){
    console.log('进入patch: 组件 init', newVNode, old)
  }else {
    if(isSameVNode(newVNode, old)) {
      console.log('进入patch：更新:patchVNode', newVNode, old)
      patchVNode(newVNode, old)
    }else {
      console.log('进入patch：更新:替换', newVNode, old)
      createDOM(newVNode)
      old.elm.parentElement.replaceChild(newVNode.elm, old.elm)
    }
  }
}

// 值得比较，深入diff
export function patchVNode(newVNode: VNode, oldVNode: VNode) {
  // 值得比较的情况下，沿用之前的 dom 元素
  let elm = newVNode.elm = oldVNode.elm

  if(newVNode === oldVNode) {
    return
  }
  if((newVNode.type === 'Text' && oldVNode.type === 'Text') || (newVNode.type === 'Comment' && oldVNode.type === 'Comment')) {
    if(elm.textContent !== newVNode.text) {
      console.log(elm, `patch 修改：修改文字, ${elm.textContent} -> ${newVNode.text}`)
      elm.textContent = newVNode.text
    }
    return
  }
  if(newVNode.type === 'Element' && oldVNode.type === 'Element') {
    updateProps(elm, newVNode.data.attrs, oldVNode.data.attrs)
    updateEvents(elm, newVNode.data.events, oldVNode.data.events)
    if(newVNode.children.length && !oldVNode.children.length) {
      newVNode.children.forEach(vnode => {
        createDOM(vnode)
        elm.appendChild(vnode.elm)
      })
    }else if(!newVNode.children.length && oldVNode.children.length) {
      while (elm.firstChild) {
        elm.removeChild(elm.firstChild)
      }
    }else if(newVNode.children.length && oldVNode.children.length) {
      updateChildren(elm, newVNode.children, oldVNode.children)
    }
  }
}

// dom patch 算法
export function updateChildren(parentElm, newChildren, oldChildren) {
  let oldStartIndex = 0
  let newStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  let newStartVNode = newChildren[0]
  let oldStartVNode = oldChildren[0]
  let newEndVNode = newChildren[newEndIndex]
  let oldEndVNode = oldChildren[oldEndIndex]

  let oldKeyMap

  while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 如果遇到空 VNode，向前进一位
    if(!oldStartVNode) {
      oldStartIndex++
      oldStartVNode = oldChildren[oldStartIndex]
    }else if(!oldEndVNode) {
      oldEndIndex--
      oldEndVNode = oldChildren[oldEndIndex]
    }else if(!newStartVNode) {
      newStartIndex++
      newStartVNode = newChildren(newStartIndex)
    }else if(!newEndVNode) {
      newEndIndex--
      newEndVNode = newChildren[newEndIndex]
    }else if(isSameVNode(newStartVNode, oldStartVNode)) {
      // 新节点数组的开头和旧节点数组的开头 same
      // 进行 patch，随后 index 前进
      patchVNode(newStartVNode, oldStartVNode)
      oldStartIndex++
      newStartIndex++
      oldStartVNode = oldChildren[oldStartIndex]
      newStartVNode = newChildren[newStartIndex]
    }else if(isSameVNode(newEndVNode, oldEndVNode)) {
      // 新节点数组的结尾和旧节点数组的结尾 same
      // 进行 patch，随后 index 前进
      patchVNode(newEndVNode, oldEndVNode)
      newEndIndex--
      oldEndIndex--
      newEndVNode = newChildren[newEndIndex]
      oldEndVNode = oldChildren[oldEndIndex]
    }else if(isSameVNode(newStartVNode, oldEndVNode)) {
      // 新节点数组的开头和旧节点数组的结尾 same
      // 认为旧节点向前移动
      // 进行 patch，将旧节点结尾 dom 移至此时旧节点开头 dom 之前，随后 index 前进
      patchVNode(newStartVNode, oldEndVNode)
      parentElm.insertBefore(oldEndVNode.el, oldStartVNode.elm)
      newStartIndex++
      oldEndIndex--
      newStartVNode = newChildren[newStartIndex]
      oldEndVNode = oldChildren[oldEndIndex]
    }else if(isSameVNode(newEndVNode, oldStartVNode)) {
      // 新节点数组的结尾和旧节点数组的开头 same
      // 认为旧节点向后移动
      // 进行 patch，将旧节点开头 dom 移至此时旧节点结尾 dom 之后，随后 index 前进
      patchVNode(newEndVNode, oldStartVNode)
      parentElm.insertBefore(oldStartVNode, oldEndVNode.elm.nextsibling)
      newEndIndex--
      oldStartIndex++
      newEndVNode = newChildren[newEndIndex]
      oldStartVNode = oldChildren[oldStartIndex]
    }else {
      // 进入靠 key 的比较
      if(!oldKeyMap) {
        oldKeyMap = {}
        // 如果没有 map 先按照 oldChildren 生成 key map
        for(let i = oldStartIndex; i <= oldEndIndex; i++) {
          let key = oldChildren[i].data.key
          if(key) {
            oldKeyMap[key] = i
          }
        }
      }

      // 检查当前 newStartVNode 有没有命中 keymap
      let idxInOld = oldKeyMap[newStartVNode.data.key]
      if(idxInOld && isSameVNode(oldChildren[idxInOld], newStartVNode)) {
        // 发现目标。类同与上文的 newStart 与 oldEnd 对比。将 old 目标的 dom 移动到 oldStart 之前。
        patchVNode(newStartVNode, oldChildren[idxInOld])
        parentElm.insertBefore(oldChildren[idxInOld].elm, oldStartVNode.elm)
        // 在 oldChildren 中移除被移动的 key VNode，防止之后被再次比较。
        oldChildren[idxInOld] = null
      }else {
        // 未发现目标
        // 新创建 newStartVNode dom，并放置在 oldStartVNode dom 的前面
        createDOM(newStartVNode)
        console.log('创建新节点:', newStartVNode.elm)
        parentElm.insertBefore(newStartVNode.elm, oldStartVNode.elm)
      }

      newStartIndex++
      newStartVNode = newChildren[newStartIndex]
    }
  }

  // 结束
  // 如果是 old 先遍历完，认为 [newStartIndex, newEndIndex] 之间的元素为新增元素，统一放到 newEndIndex+1 dom 的前面去
  // 如果是 new 先遍历完，认为 [oldStartIndex, oldEndIndex] 之间的元素为删除元素，统一删了
  if(oldStartIndex > oldEndIndex) {
    for(let i = newStartIndex; i <= newEndIndex; i++) {
      createDOM(newChildren[i])
      console.log('创建新节点:', newChildren[i].elm)
      parentElm.insertBefore(newChildren[i].elm, newChildren[newEndIndex + 1].elm)
    }
  }else if(newStartIndex > newEndIndex) {
    for(let i = oldStartIndex; i <= oldEndIndex; i++) {
      console.log('移除旧节点:', oldChildren[i].elm)
      parentElm.removeChild(oldChildren[i].elm)
    }
  }
}

// 根据 VNode 创建真实 dom，并附着在 VNode.elm 属性上
export function createDOM(node: VNode) {
  let $node: Node
  if(node.type === 'Element') {
    $node = document.createElement(node.tag)
    node.children.forEach(e => {
      $node.appendChild(createDOM(e))
    })
    updateProps($node, node.data.attrs, {})
    updateEvents($node, node.data.events, {})
  }
  if(node.type === 'Text') {
    $node = document.createTextNode(node.text)
  }
  if(node.type === 'Comment') {
    $node = document.createComment(node.text)
  }
  if(node.type === 'Component') {
    $node = document.createElement('div')
    let $comNode = document.createElement('div')
    $node.appendChild($comNode)
    new MiniVue(node.options).$mount($comNode)
    $node = $node.firstChild
  }
  node.elm = $node
  return $node
}

// 更新 props
function updateProps($dom, newProps, oldProps): void {
  let props = Object.assign({}, newProps, oldProps)
  Object.keys(props).forEach(name => {
    if(!oldProps[name]) {
      console.log($dom, `设置新 prop, ${name}: ${newProps[name]}`)
      setProp($dom, name, newProps[name])
    }else if(!newProps[name]) {
      console.log($dom, `移除 prop, ${name}: ${oldProps[name]}`)
      removeProp($dom, name, oldProps[name])
    }else if(newProps[name] !== oldProps[name]) {
      console.log($dom, `替换 prop, ${name}: ${oldProps[name]} -> ${newProps[name]}`)
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

// 更新 events
function updateEvents($dom, newEvents, oldEvents): void {
  let events = Object.assign({}, newEvents, oldEvents)
  Object.keys(events).forEach(name => {
    if(!oldEvents[name]) {
      console.log($dom, `绑定新 event, ${name}: ${newEvents[name]}`)
      addEvent($dom, name, newEvents[name])
    }else if(!newEvents[name]) {
      console.log($dom, `移除 event, ${name}: ${oldEvents[name]}`)
      removeEvent($dom, name, oldEvents[name])
    }else {
      console.log($dom, `替换 event, ${name}: ${oldEvents[name]} -> ${newEvents[name]}`)
      removeEvent($dom, name, oldEvents[name])
      addEvent($dom, name, newEvents[name])
    }
  })
}

function addEvent($dom, name ,cb) {
  $dom.addEventListener(name, cb)
}

function removeEvent($dom, name, cb) {
  $dom.removeEventListener(name, cb)
}


// 判断两个 VNode 是否有比较的价值
// 如果发生巨变，比如 tag 都变了，直接替换，不再深入仔细去 diff
export function isSameVNode(newVNode: VNode, oldVNode: VNode) {
  return newVNode.data.key === oldVNode.data.key &&
    newVNode.type === oldVNode.type &&
    newVNode.tag === oldVNode.tag
}