<template>
  <div>
    <button @click="incrementCounter">Counter: {{ counter }}</button>
  </div>
</template>

<script>
export default {
  props: {
    initialValue: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      counter: this.initialValue
    }
  },
  methods: {
    incrementCounter() {
      this.counter++;
      this.$emit('counter-changed', this.counter);
    }
  }
}
</script>