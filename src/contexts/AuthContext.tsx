import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, Profile, Entity } from '../lib/supabase';
import { switchActiveEntity as switchEntityLib, createNewEntity as createNewEntityLib } from '../lib/entities';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  entity: Entity | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  updateEntityName: (entityName: string) => Promise<{ error: any }>;
  updateEntityLogo: (logoUrl: string | null) => Promise<{ error: any }>;
  updateEntityDefaults: (defaults: {
    show_billable_default: boolean;
    show_reimbursable_default: boolean;
    show_enter_multiple_default: boolean;
    show_create_reports_default: boolean;
    upload_multiple_images_default: boolean;
  }) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  switchEntity: (entityId: string) => Promise<{ error: any }>;
  createNewEntity: (entityName: string) => Promise<{ entity: Entity | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Authentication verification failed:', authError);
        setProfile(null);
        setEntity(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);

        if (data.current_entity_id) {
          const { data: entityData, error: entityError } = await supabase
            .from('entities')
            .select('*')
            .eq('id', data.current_entity_id)
            .maybeSingle();

          if (entityError) {
            console.error('Error fetching entity:', entityError);
          } else if (entityData) {
            setEntity(entityData);
          }
        } else {
          setEntity(null);
        }
      } else {
        // Profile not found for authenticated user - orphaned auth session
        console.warn('⚠️ Profile not found for authenticated user. Signing out...');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setEntity(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        (async () => {
          if (event === 'TOKEN_REFRESHED') {
            setSession(session);
            setUser(session?.user ?? null);
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user) {
              await fetchProfile(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            setEntity(null);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setEntity(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('Update profile failed: No user logged in');
      return { error };
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Session expired or authentication failed:', authError);
        return { error: authError || new Error('Authentication failed') };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        return { error };
      }

      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      return { error: err };
    }
  };

  const updateEntityName = async (entityName: string) => {
    if (!user || !entity) {
      const error = new Error('No user or entity available');
      console.error('Update entity failed: No user or entity');
      return { error };
    }

    if (entityName.length > 100) {
      const error = new Error('Entity name must be 100 characters or less');
      return { error };
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Session expired or authentication failed:', authError);
        return { error: authError || new Error('Authentication failed') };
      }

      const { error } = await supabase
        .from('entities')
        .update({ entity_name: entityName.trim() })
        .eq('id', entity.id);

      if (error) {
        console.error('Failed to update entity name:', error);
        return { error };
      }

      setEntity({ ...entity, entity_name: entityName.trim() });

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating entity name:', err);
      return { error: err };
    }
  };

  const updateEntityLogo = async (logoUrl: string | null) => {
    if (!user || !entity) {
      const error = new Error('No user or entity available');
      console.error('Update entity logo failed: No user or entity');
      return { error };
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Session expired or authentication failed:', authError);
        return { error: authError || new Error('Authentication failed') };
      }

      const { error } = await supabase
        .from('entities')
        .update({ entity_logo_url: logoUrl })
        .eq('id', entity.id);

      if (error) {
        console.error('Failed to update entity logo:', error);
        return { error };
      }

      setEntity({ ...entity, entity_logo_url: logoUrl });

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating entity logo:', err);
      return { error: err };
    }
  };

  const updateEntityDefaults = async (defaults: {
    show_billable_default: boolean;
    show_reimbursable_default: boolean;
    show_enter_multiple_default: boolean;
    show_create_reports_default: boolean;
    upload_multiple_images_default: boolean;
  }) => {
    if (!user || !entity) {
      const error = new Error('No user or entity available');
      console.error('Update entity defaults failed: No user or entity');
      return { error };
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Session expired or authentication failed:', authError);
        return { error: authError || new Error('Authentication failed') };
      }

      const { error } = await supabase
        .from('entities')
        .update(defaults)
        .eq('id', entity.id);

      if (error) {
        console.error('Failed to update entity defaults:', error);
        return { error };
      }

      setEntity({ ...entity, ...defaults });

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating entity defaults:', err);
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const resetPasswordRequest = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    try {
      // Update the password - Supabase automatically invalidates other sessions
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password update failed:', error);
        return { error };
      }

      // TODO: FUTURE MFA ENHANCEMENT
      // When MFA is fully implemented:
      // 1. Invalidate all TOTP sessions
      // 2. Optionally regenerate backup codes
      // 3. Log security event: "Password changed"

      console.log('Password updated successfully. All other sessions invalidated.');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating password:', err);
      return { error: err };
    }
  };

  const switchEntity = async (entityId: string) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('Switch entity failed: No user logged in');
      return { error };
    }

    try {
      await switchEntityLib(user.id, entityId);

      await refreshProfile();

      return { error: null };
    } catch (err) {
      console.error('Unexpected error switching entity:', err);
      return { error: err };
    }
  };

  const createNewEntity = async (entityName: string) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('Create entity failed: No user logged in');
      return { entity: null, error };
    }

    try {
      const newEntity = await createNewEntityLib(user.id, entityName);

      await switchEntityLib(user.id, newEntity.id);

      await refreshProfile();

      return { entity: newEntity, error: null };
    } catch (err) {
      console.error('Unexpected error creating entity:', err);
      return { entity: null, error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        entity,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updateEntityName,
        updateEntityLogo,
        updateEntityDefaults,
        refreshProfile,
        resetPasswordRequest,
        updatePassword,
        switchEntity,
        createNewEntity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
