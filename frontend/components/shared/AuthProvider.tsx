'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { fireDeviceEvent } from '@/lib/bridge';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, loadUserData, user } = useStore();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadUserData();
            }
        });

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

    useEffect(() => {
        if (user) {
            fireDeviceEvent('authStateChange', {
                user_id: user.id,
                email: user.email,
            });
        } else {
            fireDeviceEvent('authStateChange', {
                user_id: null,
            });
        }
    }, [user]);

    return <>{children}</>;
}
