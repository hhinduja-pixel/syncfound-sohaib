import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Heart, Check, X, Clock } from "lucide-react";
import { checkProfileCompleteness } from "@/lib/profileCompleteness";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  id: string;
  matched_user_id: string;
  user_id: string;
  compatibility_score: number | null;
  created_at: string | null;
  status: string | null;
  matchedProfile: {
    full_name: string;
    avatar_url: string | null;
    primary_role: string | null;
    city: string | null;
    domain: string | null;
  } | null;
  isIncoming: boolean;
}

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      // Check profile completeness
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, skills(skill)")
        .eq("id", user.id)
        .single();
      
      const completeness = checkProfileCompleteness(profile as any);
      if (!completeness.isComplete) {
        navigate("/profile-setup");
        return;
      }
      
      setUser(user);
      fetchMatches(user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchMatches = async (userId: string) => {
    setLoading(true);
    
    // Fetch matches where user is either user_id or matched_user_id
    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

    if (error) {
      console.error("Error fetching matches:", error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // For each match, fetch the other user's profile
    const matchesWithProfiles = await Promise.all(
      (matchesData || []).map(async (match) => {
        const otherUserId = match.user_id === userId ? match.matched_user_id : match.user_id;
        const isIncoming = match.matched_user_id === userId;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, primary_role, city, domain")
          .eq("id", otherUserId)
          .maybeSingle();

        return {
          ...match,
          matchedProfile: profile,
          isIncoming,
        };
      })
    );

    setMatches(matchesWithProfiles);
    setLoading(false);
  };

  const handleAcceptMatch = async (matchId: string) => {
    const { error } = await supabase
      .from("matches")
      .update({ status: "active" })
      .eq("id", matchId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept match",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Match accepted!",
        description: "You can now chat with your new match",
      });
      if (user) fetchMatches(user.id);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    const { error } = await supabase
      .from("matches")
      .update({ status: "rejected" })
      .eq("id", matchId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject match",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Match declined",
      });
      if (user) fetchMatches(user.id);
    }
  };

  const activeMatches = matches.filter(m => m.status === "active");
  const pendingMatches = matches.filter(m => m.status === "pending" && m.isIncoming);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Your Matches</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Keep swiping to find your perfect co-founder!
            </p>
            <Button onClick={() => navigate("/")}>
              Discover Founders
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active" className="gap-2">
                Active
                {activeMatches.length > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {activeMatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingMatches.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-600 text-xs px-2 py-0.5 rounded-full">
                    {pendingMatches.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active matches yet
                </div>
              ) : (
                activeMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => navigate(`/chat/${match.id}`)}
                    className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={match.matchedProfile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80"}
                        alt={match.matchedProfile?.full_name || "Match"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {match.matchedProfile?.full_name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {match.matchedProfile?.primary_role || "Founder"}
                        {match.matchedProfile?.city && ` • ${match.matchedProfile.city}`}
                      </p>
                      {match.matchedProfile?.domain && (
                        <p className="text-xs text-primary truncate">
                          {match.matchedProfile.domain}
                        </p>
                      )}
                    </div>

                    <Button size="icon" variant="ghost" className="rounded-full shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3">
              {pendingMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                pendingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4"
                  >
                    <div className="relative">
                      <img
                        src={match.matchedProfile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80"}
                        alt={match.matchedProfile?.full_name || "Match"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-card flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {match.matchedProfile?.full_name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {match.matchedProfile?.primary_role || "Founder"}
                        {match.matchedProfile?.city && ` • ${match.matchedProfile.city}`}
                      </p>
                      <p className="text-xs text-amber-600">
                        Wants to connect with you
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="rounded-full h-10 w-10 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectMatch(match.id);
                        }}
                      >
                        <X className="h-5 w-5 text-red-500" />
                      </Button>
                      <Button 
                        size="icon" 
                        className="rounded-full h-10 w-10 bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptMatch(match.id);
                        }}
                      >
                        <Check className="h-5 w-5 text-white" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Matches;
