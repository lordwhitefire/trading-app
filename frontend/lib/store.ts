import create from 'zustand';

interface AppState {
  strategies: any[];
  backtestResults: any | null;
  liveSignals: any[];
  addStrategy: (strategy: any) => void;
  setBacktestResults: (results: any) => void;
  addLiveSignal: (signal: any) => void;
}

const useStore = create<AppState>((set) => ({
  strategies: [],
  backtestResults: null,
  liveSignals: [],
  addStrategy: (strategy) => set((state) => ({ strategies: [...state.strategies, strategy] })),
  setBacktestResults: (results) => set({ backtestResults: results }),
  addLiveSignal: (signal) => set((state) => ({ liveSignals: [...state.liveSignals, signal] })),
}));

export default useStore;
