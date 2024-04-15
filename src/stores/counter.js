import { defineStore } from 'pinia';

export const useCounterStore = defineStore({
  id: 'counter',
  state: () => ({
    counters: Array(4).fill(0)
  }),
  actions: {
    incrementCounter(index) {
      this.counters[index]++;
    }
  }
});