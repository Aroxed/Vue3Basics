<template>
  <button @click="incrementCounter">Counter: {{ counter }}</button>
</template>

<script setup>
import { useCounterStore } from '../stores/counter';
import { computed } from 'vue';

const props = defineProps({
  index: {
    type: Number,
    default: 0
  }
});

const counterStore = useCounterStore();
const localIindex = props.index;
const counter = computed(() => counterStore.counters[localIindex]);

const incrementCounter = () => counterStore.incrementCounter(localIindex);
</script>