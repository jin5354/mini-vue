import MiniVue from '../src/index'

let app = new MiniVue({
  el: '#app',
  data() {
    return {
      text: '测试文本',
      show: true
    }
  },
  template: `<div class="container">
    <p>{{text}}</p>
    <p v-show="show">show</p>
  </div>`,
  mounted() {
    console.log('mounted')
    console.log(this.test)
  }
})

console.log(app)
app.text = 2
