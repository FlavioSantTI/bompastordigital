import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'user' | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    role: null,
    loading: true,
    isAdmin: false,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Verificar sessão atual ao carregar
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            extractRole(session?.user);
            setLoading(false);
        });

        // 2. Escutar mudanças (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            extractRole(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Helper para extrair role dos metadados
    const extractRole = (u: User | null | undefined) => {
        if (!u) {
            setRole(null);
            return;
        }
        // Admin pode ser definido por meta-dados OU por email hardcoded (segurança extra)
        // Exemplo: admin@bompastor.com
        const metaRole = u.user_metadata?.role;
        setRole(metaRole === 'admin' ? 'admin' : 'user');
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Estado atualiza via onAuthStateChange
    };

    const value = {
        user,
        session,
        role,
        loading,
        isAdmin: role === 'admin',
        signOut
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    return useContext(AuthContext);
};
