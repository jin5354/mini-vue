const START_TAG_REG = /^<([^<>\s\/]+)((\s+[^=>\s]+(\s*=\s*((\"[^"]*\")|(\'[^']*\')|[^>\s]+))?)*)\s*\/?\s*>/m
const END_TAG_REG = /^<\/([^>\s]+)[^>]*>/m
const ATTRIBUTE_REG = /([^=\s]+)(\s*=\s*((\"([^"]*)\")|(\'([^']*)\')|[^>\s]+))?/gm
const TEXT_EXP_REG = /\{\{((?:.|\n)+?)\}\}/g

// todo
// optimize, 标记静态节点，标记静态根

export class ASTElement {
  type
  children
  tag
  text
  data
  parent
  expression
  ifProcessed = false
  forProcessed = false


  constructor(
    type: 'Element' | 'Text' | 'Comment',
    children: ASTElement[],
    tag: string,
    text: string,
    data: ASTElementData | null,
    parent: ASTElement | ASTRoot
  ) {
    this.type = type
    this.children = children
    this.tag = tag
    this.text = text
    this.data = data
    this.parent = parent

    if(!(this.parent instanceof ASTElement)) {
      this.parent = null
    }

    if(this.type === 'Text') {
      this.expression = parseText(this.text)
    }
  }
}

export default function parse(source: string): ASTElement[] {

  let result: ASTRoot = {
    children: []
  }
  let stack = []
  let zone: any = null

  stack.push(result)
  zone = result

  while(source.length > 0) {

    // 判断一些节点，如果都不符合按照文本处理
    // 判断接下来要处理的是不是注释 <!-- 开头
    if(source.startsWith('<!--')) {
      // 找注释结尾的位置，找到了，就提取出注释节点
      let endIndex = source.indexOf('-->')
      if(endIndex !== -1) {
        // console.log(`发现注释节点${source.substring(4, endIndex)}`)
        zone.children.push(new ASTElement('Comment', [], '', source.substring(4, endIndex), {}, zone))
        source = source.substring(endIndex + 3)
        continue
      }
    }
    // 判断是不是 end Tag
    else if(source.startsWith('</') && END_TAG_REG.test(source)) {
      let left = RegExp.leftContext
      let tag = RegExp.lastMatch
      let right = RegExp.rightContext

      //console.log(`发现闭合标签 ${tag}`)
      let result = tag.match(END_TAG_REG)
      let name = result[1]

      if(name === zone.tag) {
        stack.pop()
        zone = stack[stack.length - 1]
        // console.log('闭合，出栈')
      }else {
        throw new Error('闭合标签对不上，html 语法出错')
      }
      source = right
      continue
    }
    // 判断是不是 start Tag
    else if(source.charAt(0) === '<' && START_TAG_REG.test(source)) {
      let left = RegExp.leftContext
      let tag = RegExp.lastMatch
      let right = RegExp.rightContext

      let result = tag.match(START_TAG_REG)
      let tagName = result[1]
      let attrs = result[2]
      let attrMap = {}
      let nodeData: ASTElementData = {
        attrs: {},
        events: {},
        directives: {},
        rawAttrs: {}
      }

      // 抽取 attributes
      if(attrs) {
        attrs.replace(ATTRIBUTE_REG, (a0, a1, a2, a3, a4, a5, a6) => {
          let attrName = a1
          let attrValue = a3 || null
          if(attrValue && attrValue.startsWith('"') && attrValue.endsWith('"')) {
            attrMap[attrName] = attrValue.slice(1, attrValue.length - 1)
          }else if(attrValue && attrValue.startsWith("'") && attrValue.endsWith("'")) {
            attrMap[attrName] = attrValue.slice(1, attrValue.length - 1)
          }else {
            attrMap[attrName] = attrValue
          }
          return ''
        })
      }

      processAttrs(nodeData, attrMap)

      // console.log(`发现元素节点${tag}`)
      let element = new ASTElement('Element', [], tagName, '', nodeData, zone)
      zone.children.push(element)
      // 如果不是自闭合 tag，入栈
      if(!tag.endsWith('/>')) {
        stack.push(element)
        zone = element
      }
      source = right
      continue
    }

    // 确认为文字模式，开始识别文本节点
    // console.log('开始识别文字')
    let index = source.indexOf('<', 1)
    if(index == -1) {
      if(zone.children[zone.children.length - 1] && zone.children[zone.children.length - 1].type === 'Text') {
        zone.children[zone.children.length - 1].text += source
      }else {
        zone.children.push(new ASTElement('Text', [], '', source, {}, zone))
      }
      source = ''
    }else {
      if(zone.children[zone.children.length - 1] && zone.children[zone.children.length - 1].type === 'Text') {
        zone.children[zone.children.length - 1].text += source.substring(0, index)
      }else {
        zone.children.push(new ASTElement('Text', [], '', source.substring(0, index), {}, zone))
      }
      source = source.substring(index)
    }
  }

  return result.children
}

// 处理 attr，解析出 key ref 指令 事件等
function processAttrs(nodeData, attrMap) {
  Object.keys(attrMap).forEach(k => {
    if(k === ':key') {
      nodeData.key = attrMap[k]
    }else if(k === 'key') {
      nodeData.key = '`' + attrMap[k] + '`'
    }else if(k === 'ref') {
      nodeData.ref = attrMap[k]
    }else if(k.startsWith('v-')) {
      if(k.slice(2) === 'on') {
        nodeData.events[k.slice(2)] = attrMap[k]
      }else {
        nodeData.directives[k.slice(2)] = attrMap[k]
      }
    }else {
      nodeData.attrs[k] = attrMap[k]
    }
  })

  nodeData.rawAttrs = attrMap
}

// 解析文本内容中的 {{}}，并转换为 _s 表达式
function parseText(text) {
  let result = text.match(TEXT_EXP_REG)
  if(!result) {
    return null
  }
  return text.replace(TEXT_EXP_REG, (match) => {
    return `_s(${match.slice(2, match.length - 2)})`
  })
}