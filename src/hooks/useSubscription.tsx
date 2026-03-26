import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

interface SubscriptionState {
  tier: SubscriptionTier;
  loading: boolean;
  isPro: boolean;
  isPremium: boolean;
}

export function useSubscription(): SubscriptionState {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // For now, all users are free tier
    // TODO: Integrate with subscriptions table when Razorpay is set up
    setTier('free');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    tier,
    loading,
    isPro: tier === 'pro' || tier === 'premium',
    isPremium: tier === 'premium',
  };
}
