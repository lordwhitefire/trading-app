'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, loadUserData } = useStore();

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

    return <>{children}</>;
}