<template>
    <div>
      <h1>Maximum value of counters: {{ maxCounter }}</h1>
      <div v-for="i in 4" :key="i">
        <counter-button :initial-value="10" @counter-changed="handleCounterChanged"></counter-button>
      </div>
    </div>
</template>
  
  <script setup>
  import { ref } from 'vue';
  import CounterButton from './CounterButton.vue';
  
  const maxCounter = ref(0);
  
  function handleCounterChanged(newCounter) {
    if (newCounter > maxCounter.value) {
      maxCounter.value = newCounter;
    }
  }
  </script>