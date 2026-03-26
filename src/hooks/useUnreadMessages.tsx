import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let userId: string | null = null;

    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      userId = user.id;

      // Get all matches for the user
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);

      if (!matches || matches.length === 0) {
        setUnreadCount(0);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Count unread messages (not sent by current user and not read)
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refetch count on any message change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadCount;
}
