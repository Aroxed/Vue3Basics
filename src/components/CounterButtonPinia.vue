<template>
  <button @click="incrementCounter">Counter: {{ counter }}</button>
</template>

<script setup>
import { ref } from 'vue';
import { useCounterStore } from '../stores/counter';
import { computed } from 'vue';
const props = defineProps({
    index1: {
      type: Number,
      default: 0
    }
  });

const counterStore = useCounterStore();
const index = ref(0);
const counter = computed(() => counterStore.counters[index]);

const incrementCounter = () => counterStore.incrementCounter(index);
</script>