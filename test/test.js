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
  template: `<div class="container" v-show="show">
    <!-- test -->
    <button v-on="clickHandler">click me</button>
    <ul :class="testClass">
      <li v-for="city in arr" :key="city">{{city}}</li>
    </ul>
  </div>`,
  mounted() {
    console.log('mounted')
    console.log(this.test)
  },
  methods: {
    clickHandler() {
      alert('pop!')
    }
  }
})

console.log(app)
setTimeout(() => {
  app.arr.splice(1, 0, '广州')
}, 5000)

