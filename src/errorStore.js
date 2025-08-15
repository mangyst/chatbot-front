import { create } from 'zustand';

export const useErrorStore = create((set) => ({
  error: null,
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
}));