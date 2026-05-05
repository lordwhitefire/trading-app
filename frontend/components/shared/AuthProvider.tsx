'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, loadUserData, user } = useStore();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadUserData();
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    loadUserData();
                } else {
                    setUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Notify native layer when user changes
    useEffect(() => {
        if (user && typeof window !== 'undefined' && (window as any).AlphaDeskBridge) {
            (window as any).AlphaDeskBridge.postMessage(JSON.stringify({
                action: 'setUserId',
                payload: { userId: user.id }
            }));
        }
    }, [user]);

    return <>{children}</>;
}