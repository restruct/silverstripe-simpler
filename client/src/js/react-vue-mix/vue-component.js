Vue.component('vue-charcounter', {
    props: ['value'],
    template: `
      <small>Vue character count: {value.length}</small>
    `
})