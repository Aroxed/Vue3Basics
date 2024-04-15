import { defineStore } from 'pinia';
import axios from 'axios';

export const useCounterStore = defineStore({
  id: 'counter',
  state: () => ({
    counters: Array(4).fill(0)
  }),
  actions: {
    incrementCounter(index) {
      this.counters[index]++;
    },
    async saveCountersToServer() {
      try {
        const response = await axios.post('http://localhost:3000/save/', this.counters);
        console.log('Counters saved to server:', response.data);
        alert(response.data.message)
      } catch (error) {
        console.error('Error saving counters to server:', error);
      }
    }
  }
});