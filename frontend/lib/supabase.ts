import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Listen for native Android auth callback — no Capacitor needed
if (typeof window !== 'undefined') {
    window.addEventListener('supabase-auth-callback', async (e: any) => {
        const url = e.detail?.url;
        if (url) {
            const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
            }
        }
    });
}