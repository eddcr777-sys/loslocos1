import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { api, Profile } from '../services/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  username: string;
  faculty: string;
  university: string;
  birthDate: string;
}


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  register: (data: RegisterCredentials) => Promise<{ data: any; error: any }>;
  login: (data: LoginCredentials) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  unreadNotifications: number;
  decrementUnreadNotifications: () => void;
  clearUnreadNotifications: () => void;
  isAdmin: boolean;
  isInstitutional: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await api.getProfile(userId);
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
            if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error obteniendo sesión:", error);
      setLoading(false); // Asegura que la app cargue incluso si hay error
    });

    // Escuchar cambios en la autenticación (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Notifications Logic with Private Channel and Proper Cleanup
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial unread count
    const fetchUnread = async () => {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false);
            
            if (error) {
                console.error('DEBUG: AuthContext - Fetch error:', error.message);
                if (error.code === '42501') {
                    console.warn('RLS Error: Insufficient permissions for notifications');
                }
            }
            setUnreadNotifications(count || 0);
        } catch (err) {
            console.error('AuthContext - Error fetching unread count:', err);
        }
    };
    fetchUnread();

    // 2. Subscribe to new notifications using a robust channel name
    const channelName = `notifs-${user.id}`;
    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                console.log('REALTIME: Nueva notificación recibida!', payload);
                setUnreadNotifications(prev => prev + 1);
            }
        )
        .subscribe((status) => {
            console.log(`REALTIME STATUS (${channelName}):`, status);
        });

    return () => {
        // Subscribe cleanup
        supabase.removeChannel(channel);
        console.log(`REALTIME: Canal ${channelName} desmontado.`);
    };
  }, [user]);

  // Update document title with unread count
  useEffect(() => {
    const baseTitle = 'ConociendoGente';
    if (unreadNotifications > 0) {
      document.title = `(${unreadNotifications}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadNotifications]);

  const decrementUnreadNotifications = useCallback(() => {
    setUnreadNotifications((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const clearUnreadNotifications = useCallback(() => {
    setUnreadNotifications(0);
  }, []);

  const register = useCallback(async ({ email, password, fullName, username, faculty, university, birthDate }: RegisterCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            faculty: faculty,
            university: university,
            birth_date: birthDate,
            user_type: 'common' // Default role in metadata
          },
        },
      });
      return { data, error };
    } catch (error) {
      console.error("Error crítico en register:", error);
      return { data: null, error };
    }
  }, []);


  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error("Error crítico en login:", error);
      return { data: null, error };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
      if (user) {
          await fetchProfile(user.id);
      }
  }, [user]);

  const value = useMemo(() => {
    // Requisito: Usar JWT claims (user_metadata o app_metadata)
    // Buscamos el rol tanto en el perfil (DB) como en los metadata del JWT (Seguridad)
    const metadata = user?.app_metadata || user?.user_metadata || {};
    const roleFromClaim = metadata.user_type || metadata.role;
    const effectiveUserType = profile?.user_type || roleFromClaim;

    const isAdmin = effectiveUserType === 'ceo' || effectiveUserType === 'admin';
    const isInstitutional = effectiveUserType === 'institutional';
    
    return {
      session, user, profile, register, login, logout, loading, refreshProfile, unreadNotifications,
      decrementUnreadNotifications, clearUnreadNotifications, isAdmin, isInstitutional
    };
  }, [session, user, profile, loading, register, login, logout, refreshProfile, unreadNotifications, decrementUnreadNotifications, clearUnreadNotifications]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <h2>Cargando...</h2>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};