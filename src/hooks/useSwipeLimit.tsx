import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DAILY_SWIPE_LIMIT = 10;

export function useSwipeLimit() {
  const [swipesUsed, setSwipesUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSwipeCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get start of today in UTC
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (!error && count !== null) {
      setSwipesUsed(count);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSwipeCount();
  }, [fetchSwipeCount]);

  const remainingSwipes = Math.max(0, DAILY_SWIPE_LIMIT - swipesUsed);
  const canSwipe = remainingSwipes > 0;

  const incrementSwipeCount = useCallback(() => {
    setSwipesUsed(prev => prev + 1);
  }, []);

  return {
    swipesUsed,
    remainingSwipes,
    canSwipe,
    dailyLimit: DAILY_SWIPE_LIMIT,
    loading,
    incrementSwipeCount,
    refetch: fetchSwipeCount
  };
}
