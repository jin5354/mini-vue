import MiniVue from '../src/index'

let app = new MiniVue({
  el: '#app',
  data() {
    return {
      text: '测试文本',
      show: true,
      testClass: 'dynamic-class',
      arr: ['上海', '杭州', '北京', '深圳']
    }
  },
  template: `<div class="container">
    <!-- test -->
    <button v-on:click="clickHandler">click me</button>
    <ul :class="testClass" v-if="show">
      <li v-for="city in arr" >{{city}}</li>
    </ul>
  </div>`,
  mounted() {
    console.log('mounted')
    console.log(this.test)
  },
  methods: {
    clickHandler() {
      alert(`pop! ${this.arr.join(',')}`)
    }
  }
})

console.log(app)
setTimeout(() => {
  app.arr[2] = '广州'
  // setTimeout(() => {
  //   app.testClass = 'dynamic-class-changed'
  //   setTimeout(() => {
  //     app.show = false
  //   }, 2000)
  // }, 3000)
}, 3000)

