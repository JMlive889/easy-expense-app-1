import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type EntityRole = 'owner' | 'accountant' | 'guest' | null;

export function useEntityRole() {
  const [role, setRole] = useState<EntityRole>(null);
  const [loading, setLoading] = useState(true);
  const { user, entity } = useAuth();

  useEffect(() => {
    async function fetchRole() {
      if (!user || !entity) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('entity_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('entity_id', entity.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching entity role:', error);
          setRole(null);
        } else {
          setRole(data?.role || null);
        }
      } catch (err) {
        console.error('Unexpected error fetching entity role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user, entity]);

  return { role, loading };
}
