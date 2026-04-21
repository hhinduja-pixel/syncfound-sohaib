import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface MatchedUser {
  full_name: string;
  avatar_url: string | null;
  primary_role: string | null;
}

const Chat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchMatchDetails(user.id);
      await fetchMessages();
      setLoading(false);
    };

    checkAuth();
  }, [matchId, navigate]);

  useEffect(() => {
    if (!matchId || !user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          // Mark message as read if it's from the other user
          if (newMsg.sender_id !== user.id) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
          );
        }
      )
      .subscribe();

    // Set up presence channel for typing indicators
    presenceChannelRef.current = supabase
      .channel(`presence-${matchId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current?.presenceState();
        const otherUsers = Object.values(state || {}).flat().filter(
          (presence: any) => presence.user_id !== user.id
        );
        setIsTyping(otherUsers.some((u: any) => u.typing));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannelRef.current?.track({
            user_id: user.id,
            typing: false,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Mark unread messages as read
    if (user && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => msg.sender_id !== user.id && !msg.read_at
      );
      unreadMessages.forEach((msg) => markMessageAsRead(msg.id));
    }
  }, [messages, user]);

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("read_at", null);
  };

  const handleTyping = async () => {
    if (!user || !presenceChannelRef.current) return;

    // Update presence to show typing
    await presenceChannelRef.current.track({
      user_id: user.id,
      typing: true,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track({
          user_id: user.id,
          typing: false,
        });
      }
    }, 3000);
  };

  const fetchMatchDetails = async (userId: string) => {
    if (!matchId) return;

    const { data: match } = await supabase
      .from("matches")
      .select("user_id, matched_user_id")
      .eq("id", matchId)
      .maybeSingle();

    if (!match) return;

    const otherUserId = match.user_id === userId ? match.matched_user_id : match.user_id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, primary_role")
      .eq("id", otherUserId)
      .maybeSingle();

    setMatchedUser(profile);
  };

  const fetchMessages = async () => {
    if (!matchId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId || sending) return;

    setSending(true);
    
    // Stop typing indicator
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.track({
        user_id: user.id,
        typing: false,
      });
    }
    
    const { error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {matchedUser && (
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={matchedUser.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80"}
                alt={matchedUser.full_name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-semibold truncate">{matchedUser.full_name}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {matchedUser.primary_role || "Founder"}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No messages yet. Say hello! 👋
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.sender_id === user?.id ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-2 rounded-2xl",
                    message.sender_id === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <p
                      className={cn(
                        "text-[10px]",
                        message.sender_id === user?.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.sender_id === user?.id && message.read_at && (
                      <span className="text-[10px] text-primary-foreground/70">
                        · Seen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-background border-t border-border">
        <form onSubmit={sendMessage} className="max-w-lg mx-auto p-4 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;
