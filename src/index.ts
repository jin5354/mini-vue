import Compile from './Compile'
import {observify, watch} from 'leaf-observable'

export default class MiniVue {
  $data: any
  $options: any
  $compile: Compile

  constructor(options) {
    this.$options = options
    this.$data = options.data()
    Object.keys(this.$data).forEach(key => {
      this._dataProxy(key)
    })

    // 数据响应化
    observify(this.$data)

    // 渲染DOM
    this.$compile = new Compile(options.el, this)
  }

  private _dataProxy(key) {
    Object.defineProperty(this, key, {
      configurable: false,
      enumerable: true,
      get:() => {
        return this.$data[key]
      },
      set:(newVal) => {
        this.$data[key] = newVal
      }
    })
  }
}