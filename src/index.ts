import {mountComponent} from './compile'
import {patch} from './vdom'
import {observify, watch} from 'leaf-observable'

export default class MiniVue {
  $data: any
  $options: any
  _patch = patch

  constructor(options) {
    this.$options = options
    this.$data = options.data()

    this._init()
  }

  // static extend(extendOptions) {
  //   const Super = this
  //   const Sub = function(options) {
  //     this._init()
  //   }

  //   Sub.prototype = Object.create(Super.prototype)
  //   Sub.prototype.constructor = Sub
  //   Sub.super = Super
  // }

  private _init() {
    this.initState()

    // 如果传入了 el， 就直接挂载，否则等待用户手动调用 .$mount
    if(this.$options.el) {
      this.$mount(this.$options.el)
    }
  }

  private initState() {
    // data 数据代理
    Object.keys(this.$data).forEach(key => {
      this._dataProxy(key)
    })

    // 数据响应化
    observify(this.$data)

    // initMethods 放 vm 上
    if(this.$options.methods) {
      for(let method in this.$options.methods) {
        this[method] = this.$options.methods[method].bind(this)
      }
    }
  }

  // 使用 vm.test 就可以读写 vm.$data.test 的内容
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

  $mount(el) {
    return mountComponent(this, el)
  }
}
