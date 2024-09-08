<template>
  <div>
    <h1>The Maximum value of counters: {{ maxCounter }}</h1>
    <div v-for="i in 4" :key="i">
      <counter-button @counter-changed="handleCounterChanged" :initial-value="0"></counter-button>
    </div>
  </div>
</template>

<script>
import CounterButton from './CounterButton.vue';

export default {
  components: {
    CounterButton
  },
  data() {
    return {
      maxCounter: 0
    }
  },
  methods: {
    handleCounterChanged(newCounter) {
      if (newCounter > this.maxCounter) {
        this.maxCounter = newCounter;
      }
    }
  }
}
</script>
