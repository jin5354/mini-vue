import MiniVue from './index'
import {parse, updateElement} from './vdom'

export default class Compile {
  $el: any
  $vm: MiniVue

  constructor(el, vm) {
    this.$el = document.querySelector(el)
    this.$vm = vm

    updateElement(this.$el, parse(this.$vm.$options.template)[0])
  }
}