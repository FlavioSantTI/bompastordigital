import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'user' | null;

interface AuthState {
    user: User | null;
    session: Session | null;
    role: UserRole;
    loading: boolean;
}

interface AuthContextType extends AuthState {
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

const resolveRole = (u: User): UserRole => {
    return u.user_metadata?.role === 'admin' ? 'admin' : 'user';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        role: null,
        loading: true,
    });

    // Ref para rastrear se o usuário fez logout explicitamente
    const isSigningOut = useRef(false);

    useEffect(() => {
        // 1. Carregar sessão inicial
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.warn('[Auth] Erro ao recuperar sessão:', error.message);
                // Se houver erro de refresh token, limpar sessão local sem entrar em loop
                if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
                    console.warn('[Auth] Token de refresh inválido detectado. Limpando sessão local...');
                    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                }
                setAuthState({ user: null, session: null, role: null, loading: false });
                return;
            }

            if (session?.user) {
                console.log('[Auth] Sessão recuperada para:', session.user.email);
                setAuthState({
                    user: session.user,
                    session,
                    role: resolveRole(session.user),
                    loading: false,
                });
            } else {
                console.log('[Auth] Nenhuma sessão ativa encontrada.');
                setAuthState({ user: null, session: null, role: null, loading: false });
            }
        }).catch((err) => {
            console.error('[Auth] Exceção ao carregar sessão:', err);
            setAuthState({ user: null, session: null, role: null, loading: false });
        });

        // 2. Escutar mudanças de autenticação (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] Evento de autenticação:', event, session ? 'com sessão' : 'sem sessão');

            switch (event) {
                case 'SIGNED_IN':
                case 'USER_UPDATED':
                    if (session?.user) {
                        setAuthState({
                            user: session.user,
                            session,
                            role: resolveRole(session.user),
                            loading: false,
                        });
                    }
                    break;

                case 'TOKEN_REFRESHED':
                    // Só atualiza se o refresh foi bem-sucedido (session válida)
                    if (session?.user) {
                        console.log('[Auth] Token renovado com sucesso.');
                        setAuthState({
                            user: session.user,
                            session,
                            role: resolveRole(session.user),
                            loading: false,
                        });
                    } else {
                        // Refresh falhou — NÃO deslogar automaticamente
                        // Isso evita o loop infinito de redirecionamento
                        console.warn('[Auth] Falha no refresh do token. Mantendo sessão atual.');
                    }
                    break;

                case 'SIGNED_OUT':
                    // Só limpa o estado se foi um logout explícito
                    console.log('[Auth] Usuário deslogado.');
                    setAuthState({ user: null, session: null, role: null, loading: false });
                    break;

                case 'INITIAL_SESSION':
                    // Sessão inicial — tratada pelo getSession acima, mas garantir consistência
                    if (session?.user) {
                        setAuthState({
                            user: session.user,
                            session,
                            role: resolveRole(session.user),
                            loading: false,
                        });
                    } else {
                        setAuthState({ user: null, session: null, role: null, loading: false });
                    }
                    break;

                default:
                    // Outros eventos (PASSWORD_RECOVERY, etc.)
                    if (session?.user) {
                        setAuthState({
                            user: session.user,
                            session,
                            role: resolveRole(session.user),
                            loading: false,
                        });
                    }
                    break;
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        isSigningOut.current = true;
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('[Auth] Erro ao fazer logout:', err);
            // Mesmo com erro, limpar estado local
            setAuthState({ user: null, session: null, role: null, loading: false });
        } finally {
            isSigningOut.current = false;
        }
    };

    return (
        <AuthContext.Provider value={{
            ...authState,
            isAdmin: authState.role === 'admin',
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
