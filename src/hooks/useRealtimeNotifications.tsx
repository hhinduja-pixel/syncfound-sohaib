import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRealtimeNotifications(userId: string | undefined) {
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    console.log("Setting up realtime notifications for user:", userId);

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `matched_user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("New match received:", payload);
          
          // Fetch the matcher's profile
          const { data: matcherProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          toast({
            title: "New Match! 🎉",
            description: matcherProfile 
              ? `${matcherProfile.full_name} matched with you!` 
              : "Someone matched with you!",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log("New message received:", payload);
          
          // Only notify if the message is not from the current user
          if (payload.new.sender_id === userId) return;

          // Check if this message belongs to a match the user is part of
          const { data: match } = await supabase
            .from("matches")
            .select("user_id, matched_user_id")
            .eq("id", payload.new.match_id)
            .single();

          if (!match) return;

          // Verify user is part of this match
          if (match.user_id !== userId && match.matched_user_id !== userId) return;

          // Fetch sender's profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const messagePreview = payload.new.content.length > 50 
            ? `${payload.new.content.substring(0, 50)}...` 
            : payload.new.content;

          toast({
            title: senderProfile?.full_name || "New Message",
            description: messagePreview,
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up realtime notifications");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, toast]);
}
