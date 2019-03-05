import {watch} from 'leaf-observable'
import {VNode, createElementVNode, createEmptyVNode, createTextVNode, patch, createCommentVNode} from './vdom'
import parse from './parser'

export function mountComponent(vm, el) {
  vm.$el = document.querySelector(el)

  installRenderHelpers(vm)
  vm.$options.render = vm.$options.render || compileToFunctions(parse(vm.$options.template)[0])

  // 在 mount 阶段使用 watcher，做到 vm 中的 data 有变化时，自动触发更新
  // 此处直接将更新操作放在 exp 中。 callback 设为空。使得第一次触发也进行 dom 更新。
  // 如果 vm 无 _vnode 属性，则为首次渲染，每次渲染时会将 VNode 挂在 _vnode 属性上
  watch(() => {
    let prevVNode = vm._vnode
    let vNode = vm.$options.render.call(vm)
    vm._vnode = vNode
    if(prevVNode) {
      vm._patch(vNode, prevVNode)
    }else {
      vm._patch(vNode, vm.$el)
    }
  }, () => {})

  return vm
}

// 将 ast 翻译为 render 函数
function compileToFunctions(ast: ASTElement) {

  console.log(ast)

  let code
  if(!ast) {
    code = '_c("div")'
  }else {
    code = genElement(ast)
  }

  console.log('code:', code)

  return new Function(`with(this) {
    return ${code}
  }`)
}

function genElement(el: ASTElement): string {
  switch(el.type) {
    case('Element'): {
      if(el.data.directives.for && !el.forProcessed) {
        return genFor(el)
      }
      if(el.data.directives.if && !el.ifProcessed) {
        return genIf(el)
      }else {
        let data = genData(el)
        let children = genChildren(el)
        return `_c('Element', '${el.tag}', ${data}, ${children})`
      }
    }
    case('Text'): {
      return el.expression || `_s(\`${el.text}\`)`
    }
    case('Comment'): {
      return `_m(\`${el.text}\`)`
    }
  }
}

function genIf(el: ASTElement): string {
  el.ifProcessed = true
  return `(${el.data.directives.if}) ? ${genElement(el)} : _e()`
}

function genFor(el: ASTElement): string {
  el.forProcessed = true
  let result = el.data.directives.for.match(/(\w+)\sin\s(\w+)/)
  let iterator = result[1]
  let data = result[2]
  return `...(() => {
    return ${data}.map(${iterator} => {
      return ${genElement(el)}
    })
  })()`
}

// 生成 VNode 的 data 部分
function genData(el: ASTElement): string {
  let data = '{'
  if(el.data.key) {
    data += `key: ${el.data.key},`
  }
  if(el.data.ref) {
    data += `ref: ${el.data.ref}`
  }
  if(el.data.attrs) {
    data += `attrs: ${genProps(el.data.attrs)},`
  }
  if(el.data.events) {
    data += `events: ${genEvents(el.data.events)},`
  }
  data += '}'
  return data
}

// 生成 VNode 的 data 的 attr 部分
function genProps(attrs): string {
  return `{${
    Object.keys(attrs).map(key => {
      if(key.startsWith(':')) {
        return `${key.slice(1)}: ${attrs[key]},`
      }else {
        return `${key}: '${attrs[key]}',`
      }
    }).join('')
  }}`
}

function genEvents(events): string {
  return `{${
    Object.keys(events).map(key => {
      return `${key}: ${events[key]}`
    })
  }}`
}

function genChildren(el: ASTElement): string {
  let children = el.children
  if(children.length) {
    return `[${
      children.map(e => {
        return genElement(e)
      })
    }]`
  }else {
    return `[]`
  }
}

// 为 vm 安装一些渲染用函数
function installRenderHelpers(vm) {
  vm._c = createElementVNode
  vm._e = createEmptyVNode
  vm._s = createTextVNode
  vm._m = createCommentVNode
}