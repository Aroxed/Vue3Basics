<template>
    <button @click="incrementCounter">Counter: {{ counter }}</button>
</template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    initialValue: {
      type: Number,
      default: 0
    }
  });
  
  const counter = ref(props.initialValue);
  
  const emit = defineEmits(['counter-changed']);
  
  function incrementCounter() {
    counter.value++;
    emit('counter-changed', counter.value);
  }
  </script>