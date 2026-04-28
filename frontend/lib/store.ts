import { create } from 'zustand';
import { supabase } from './supabase';

interface AppState {
  user: any | null;
  setUser: (user: any) => void;

  strategies: any[];
  backtestResults: any | null;
  liveSignals: any[];
  activeStrategy: any | null;

  savedStrategies: any[];
  savedResults: any[];

  strategyToLoad: any | null;
  setStrategyToLoad: (strategy: any) => void;

  addStrategy: (strategy: any) => void;
  setBacktestResults: (results: any) => void;
  addLiveSignal: (signal: any) => void;
  setActiveStrategy: (strategy: any) => void;
  setSavedStrategies: (strategies: any[]) => void;
  setSavedResults: (results: any[]) => void;

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
  activeStrategy: null,
  savedStrategies: [],
  savedResults: [],
  strategyToLoad: null,

  setStrategyToLoad: (strategy) => set({ strategyToLoad: strategy }),
  addStrategy: (strategy) => set((state) => ({ strategies: [...state.strategies, strategy] })),
  setBacktestResults: (results) => set({ backtestResults: results }),
  addLiveSignal: (signal) => set((state) => ({ liveSignals: [...state.liveSignals, signal] })),
  setActiveStrategy: (strategy) => set({ activeStrategy: strategy }),
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

    // Handle both single-coin and multi-coin results
    const isMulti = results?.multi_coin === true;
    const rows = isMulti
      ? // One row per coin for multi-coin results
      (results.coins as string[]).map((coin: string) => ({
        user_id: user.id,
        strategy_name: strategy.name,
        coin,
        coins: results.coins,
        timeframe: strategy.timeframe,
        results: results.results[coin],
      }))
      : [{
        user_id: user.id,
        strategy_name: strategy.name,
        coin: strategy.coin,
        coins: strategy.coins || [strategy.coin],
        timeframe: strategy.timeframe,
        results,
      }];

    const { data, error } = await supabase.from('backtest_results').insert(rows).select();
    if (!error && data) {
      set((state) => ({ savedResults: [...data, ...state.savedResults] }));
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
    set((state) => ({ savedStrategies: state.savedStrategies.filter((s) => s.id !== id) }));
  },

  deleteResult: async (id) => {
    await supabase.from('backtest_results').delete().eq('id', id);
    set((state) => ({ savedResults: state.savedResults.filter((r) => r.id !== id) }));
  },
}));

export { useStore };
export default useStore;