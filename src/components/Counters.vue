<template>
  <div>
    <h1>Maximum value of counters: {{ maxCounter }}</h1>
    <div v-for="i in 4" :key="i">
      <counter-button :index="i - 1"/>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCounterStore } from '@/stores/counter';
import CounterButton from './CounterButton.vue';

const counterStore = useCounterStore();

const maxCounter = computed(() => Math.max(...counterStore.counters));
</script>