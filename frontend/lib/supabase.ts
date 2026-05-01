import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storage: {
            getItem: (key) => {
                if (typeof window === 'undefined') return null;
                return window.localStorage.getItem(key);
            },
            setItem: (key, value) => {
                if (typeof window === 'undefined') return;
                window.localStorage.setItem(key, value);
            },
            removeItem: (key) => {
                if (typeof window === 'undefined') return;
                window.localStorage.removeItem(key);
            },
        },
    },
});

// When app comes back to foreground after OAuth, grab the session
if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                // Session exists — trigger auth state change
                supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }
        }
    });
}