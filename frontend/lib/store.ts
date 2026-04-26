import { create } from 'zustand';
import { supabase } from './supabase';

interface AppState {
  // Auth
  user: any | null;
  setUser: (user: any) => void;

  // Current session
  strategies: any[];
  backtestResults: any | null;
  liveSignals: any[];

  // Saved to DB
  savedStrategies: any[];
  savedResults: any[];

  // Actions
  addStrategy: (strategy: any) => void;
  setBacktestResults: (results: any) => void;
  addLiveSignal: (signal: any) => void;
  setSavedStrategies: (strategies: any[]) => void;
  setSavedResults: (results: any[]) => void;

  // DB actions
  saveStrategyToDB: (strategy: any) => Promise<void>;
  saveResultsToDB: (strategy: any, results: any) => Promise<void>;
  loadUserData: () => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
}

const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  strategies: [],
  backtestResults: null,
  liveSignals: [],
  savedStrategies: [],
  savedResults: [],

  addStrategy: (strategy) =>
    set((state) => ({ strategies: [...state.strategies, strategy] })),

  setBacktestResults: (results) => set({ backtestResults: results }),

  addLiveSignal: (signal) =>
    set((state) => ({ liveSignals: [...state.liveSignals, signal] })),

  setSavedStrategies: (strategies) => set({ savedStrategies: strategies }),

  setSavedResults: (results) => set({ savedResults: results }),

  saveStrategyToDB: async (strategy) => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase.from('strategies').insert({
      user_id: user.id,
      name: strategy.name,
      coin: strategy.coin,
      coins: strategy.coins || [strategy.coin],
      timeframe: strategy.timeframe,
      backtest_period: strategy.backtest_period,
      logic: strategy.logic,
      conditions: strategy.conditions,
      analysis_config: strategy.analysis_config,
    }).select();
    if (!error && data) {
      set((state) => ({ savedStrategies: [data[0], ...state.savedStrategies] }));
    }
  },

  saveResultsToDB: async (strategy, results) => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase.from('backtest_results').insert({
      user_id: user.id,
      strategy_name: strategy.name,
      coin: strategy.coin,
      coins: strategy.coins || [strategy.coin],
      timeframe: strategy.timeframe,
      results: results,
    }).select();
    if (!error && data) {
      set((state) => ({ savedResults: [data[0], ...state.savedResults] }));
    }
  },

  loadUserData: async () => {
    const { user } = get();
    if (!user) return;

    const [strategiesRes, resultsRes] = await Promise.all([
      supabase.from('strategies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('backtest_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (strategiesRes.data) set({ savedStrategies: strategiesRes.data });
    if (resultsRes.data) set({ savedResults: resultsRes.data });
  },

  deleteStrategy: async (id) => {
    await supabase.from('strategies').delete().eq('id', id);
    set((state) => ({
      savedStrategies: state.savedStrategies.filter((s) => s.id !== id),
    }));
  },

  deleteResult: async (id) => {
    await supabase.from('backtest_results').delete().eq('id', id);
    set((state) => ({
      savedResults: state.savedResults.filter((r) => r.id !== id),
    }));
  },
}));

export { useStore };
export default useStore;