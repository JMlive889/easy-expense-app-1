import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useBillingPortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openBillingPortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to access billing');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-billing-portal`;
      const returnUrl = window.location.origin + window.location.pathname;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ return_url: returnUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing portal session');
      }

      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Billing portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    openBillingPortal,
    loading,
    error,
  };
}
