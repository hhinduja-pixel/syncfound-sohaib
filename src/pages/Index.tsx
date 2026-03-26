import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FounderCard } from "@/components/FounderCard";
import { PremiumMatchCard } from "@/components/PremiumMatchCard";
import { ActionButtons } from "@/components/ActionButtons";
import { DiscoveryFilters, Filters } from "@/components/DiscoveryFilters";
import { FounderProfileModal } from "@/components/FounderProfileModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UnreadBadge } from "@/components/UnreadBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useSwipeLimit } from "@/hooks/useSwipeLimit";
import { useSubscription } from "@/hooks/useSubscription";
import syncFoundLogo from "@/assets/syncfound-logo.png";
import { MessageSquare, User, LogOut, Heart, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkProfileCompleteness } from "@/lib/profileCompleteness";
import { Progress } from "@/components/ui/progress";
const DEFAULT_FILTERS: Filters = {
  role: '',
  domain: '',
  city: '',
  timeCommitment: '',
  fundingStage: '',
  minCompatibility: 0,
};

interface CompatibilityBreakdown {
  visionAlignment: number;
  skillComplementarity: number;
  personalityMatch: number;
  timeCommitmentMatch: number;
  locationProximity: number;
  explanation: string;
}

interface Profile {
  id: string;
  full_name: string;
  age: number | null;
  city: string | null;
  primary_role: string | null;
  secondary_role: string | null;
  domain: string | null;
  startup_idea: string | null;
  funding_stage: string | null;
  time_commitment: string | null;
  mbti: string | null;
  work_style: string | null;
  risk_appetite: string | null;
  avatar_url: string | null;
  skills: { skill: string }[];
  compatibilityScore?: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
}

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'swipe_limit' | 'super_like' | 'compatibility_breakdown' | 'premium_match'>('swipe_limit');
  const navigate = useNavigate();
  const { toast } = useToast();
  const unreadCount = useUnreadMessages();
  const { remainingSwipes, canSwipe, dailyLimit, incrementSwipeCount } = useSwipeLimit();
  const { isPro } = useSubscription();

  // Premium match threshold
  const PREMIUM_MATCH_THRESHOLD = 85;

  useEffect(() => {
    // Check authentication and profile completion
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);

      // Check if profile is complete and fetch current user's full profile
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          *,
          skills (skill)
        `)
        .eq("id", session.user.id)
        .single();

      const completeness = checkProfileCompleteness(profile as any);
      if (!completeness.isComplete) {
        navigate("/profile-setup");
        return;
      }

      setCurrentUserProfile(profile as any);

      // Fetch profiles to show
      await fetchProfiles(session.user.id, profile as any);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfiles = async (userId: string, userProfile: Profile, appliedFilters?: Filters) => {
    setLoading(true);
    setCurrentIndex(0);
    
    const filtersToUse = appliedFilters || filters;
    
    // Get profiles excluding current user and already swiped users
    const { data: swipedUsers } = await supabase
      .from("swipes")
      .select("swiped_user_id")
      .eq("user_id", userId);

    const swipedIds = swipedUsers?.map(s => s.swiped_user_id) || [];
    
    let query = supabase
      .from("profiles")
      .select(`
        *,
        skills (skill)
      `)
      .neq("id", userId);

    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    // Apply filters
    if (filtersToUse.role && filtersToUse.role !== 'any') {
      query = query.ilike("primary_role", `%${filtersToUse.role}%`);
    }
    if (filtersToUse.domain && filtersToUse.domain !== 'any') {
      query = query.ilike("domain", `%${filtersToUse.domain}%`);
    }
    if (filtersToUse.timeCommitment && filtersToUse.timeCommitment !== 'any') {
      query = query.ilike("time_commitment", `%${filtersToUse.timeCommitment}%`);
    }
    if (filtersToUse.fundingStage && filtersToUse.fundingStage !== 'any') {
      query = query.ilike("funding_stage", `%${filtersToUse.fundingStage}%`);
    }
    if (filtersToUse.city && filtersToUse.city.trim() !== '') {
      query = query.ilike("city", `%${filtersToUse.city.trim()}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } else if (data && data.length > 0) {
      // Calculate compatibility for the first profile
      const profilesWithScore = data as Profile[];
      setProfiles(profilesWithScore);
      
      if (profilesWithScore.length > 0) {
        await calculateCompatibility(userProfile, profilesWithScore[0], 0);
      }
    } else {
      setProfiles([]);
    }
    
    setLoading(false);
  };

  const handleApplyFilters = () => {
    if (user && currentUserProfile) {
      fetchProfiles(user.id, currentUserProfile, filters);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    if (user && currentUserProfile) {
      fetchProfiles(user.id, currentUserProfile, DEFAULT_FILTERS);
    }
  };

  const calculateCompatibility = async (currentUser: Profile, targetUser: Profile, index: number) => {
    setCalculatingScore(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('calculate-compatibility', {
        body: {
          currentUser: {
            full_name: currentUser.full_name,
            primary_role: currentUser.primary_role,
            secondary_role: currentUser.secondary_role,
            domain: currentUser.domain,
            startup_idea: currentUser.startup_idea,
            funding_stage: currentUser.funding_stage,
            time_commitment: currentUser.time_commitment,
            mbti: currentUser.mbti,
            work_style: currentUser.work_style,
            risk_appetite: currentUser.risk_appetite,
            city: currentUser.city,
            skills: currentUser.skills?.map(s => s.skill) || []
          },
          targetUser: {
            full_name: targetUser.full_name,
            primary_role: targetUser.primary_role,
            secondary_role: targetUser.secondary_role,
            domain: targetUser.domain,
            startup_idea: targetUser.startup_idea,
            funding_stage: targetUser.funding_stage,
            time_commitment: targetUser.time_commitment,
            mbti: targetUser.mbti,
            work_style: targetUser.work_style,
            risk_appetite: targetUser.risk_appetite,
            city: targetUser.city,
            skills: targetUser.skills?.map(s => s.skill) || []
          }
        }
      });

      if (error) {
        console.error("Error calculating compatibility:", error);
        // Use a default score if AI calculation fails
        setProfiles(prev => prev.map((p, i) => 
          i === index ? { ...p, compatibilityScore: 75 } : p
        ));
      } else {
        setProfiles(prev => prev.map((p, i) => 
          i === index ? { 
            ...p, 
            compatibilityScore: data.totalScore,
            compatibilityBreakdown: {
              ...data.breakdown,
              explanation: data.explanation
            }
          } : p
        ));
      }
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      // Use a default score if AI calculation fails
      setProfiles(prev => prev.map((p, i) => 
        i === index ? { ...p, compatibilityScore: 75 } : p
      ));
    }
    
    setCalculatingScore(false);
  };

  const showUpgradeModal = (trigger: 'swipe_limit' | 'super_like' | 'compatibility_breakdown' | 'premium_match') => {
    setUpgradeModalTrigger(trigger);
    setUpgradeModalOpen(true);
  };

  const handleAction = async (action: 'pass' | 'superlike' | 'like') => {
    if (isAnimating || !user || profiles.length === 0) return;
    
    const currentProfile = profiles[currentIndex];
    const isPremiumMatch = (currentProfile.compatibilityScore || 0) >= PREMIUM_MATCH_THRESHOLD;

    // Check if this is a premium match and user is not Pro (for like/superlike)
    if (!isPro && isPremiumMatch && (action === 'like' || action === 'superlike')) {
      showUpgradeModal('premium_match');
      return;
    }

    // Check if super like is blocked for free users
    if (!isPro && action === 'superlike') {
      showUpgradeModal('super_like');
      return;
    }

    // Check swipe limit
    if (!canSwipe) {
      showUpgradeModal('swipe_limit');
      return;
    }
    
    setIsAnimating(true);

    // Save swipe to database
    const { error: swipeError } = await supabase
      .from("swipes")
      .insert({
        user_id: user.id,
        swiped_user_id: currentProfile.id,
        action: action,
      });

    if (swipeError) {
      console.error("Error saving swipe:", swipeError);
      // If it's a duplicate error, just move to next profile
      if (swipeError.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to save swipe",
          variant: "destructive",
        });
      }
    } else {
      // Increment local swipe count on successful swipe
      incrementSwipeCount();
    }

    // Check for match if it's a like or superlike (and swipe was saved successfully)
    if (!swipeError && (action === 'like' || action === 'superlike')) {
      const { data: reciprocalSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("user_id", currentProfile.id)
        .eq("swiped_user_id", user.id)
        .in("action", ["like", "superlike"])
        .maybeSingle();

      if (reciprocalSwipe) {
        // Create a match
        const { error: matchError } = await supabase
          .from("matches")
          .insert({
            user_id: user.id,
            matched_user_id: currentProfile.id,
            status: "active",
          });

        if (!matchError) {
          toast({
            title: "It's a match! 🎉",
            description: `You and ${currentProfile.full_name} matched!`,
          });
        }
      }
    }
    
    // Move to next profile
    const nextIndex = currentIndex + 1;
    if (nextIndex < profiles.length) {
      setCurrentIndex(nextIndex);
      // Calculate compatibility for next profile if not already calculated
      if (currentUserProfile && profiles[nextIndex] && !profiles[nextIndex].compatibilityScore) {
        await calculateCompatibility(currentUserProfile, profiles[nextIndex], nextIndex);
      }
    } else {
      // No more profiles
      toast({
        title: "No more profiles",
        description: "Check back later for more matches!",
      });
    }
    setIsAnimating(false);
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (direction === 'left') {
      handleAction('pass');
    } else if (direction === 'right') {
      handleAction('like');
    } else if (direction === 'up') {
      setProfileModalOpen(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/auth");
  };

  if (!user || loading) {
    return null;
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <img 
          src={syncFoundLogo} 
          alt="SyncFound" 
          className="h-8 w-auto"
        />
        <div className="flex items-center gap-3">
          <DiscoveryFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate("/matches")}
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full relative"
            onClick={() => navigate("/matches")}
          >
            <MessageSquare className="h-5 w-5" />
            <UnreadBadge count={unreadCount} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate("/profile")}
          >
            <User className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No more profiles to show</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later for more matches!</p>
          </div>
        ) : currentProfile ? (
          <div className="w-full max-w-sm">
            {/* Show Premium Match Card for 85%+ matches if user is not Pro */}
            {!isPro && (currentProfile.compatibilityScore || 0) >= PREMIUM_MATCH_THRESHOLD ? (
              <PremiumMatchCard
                name={currentProfile.full_name}
                age={currentProfile.age || 0}
                city={currentProfile.city || "Unknown"}
                role={`${currentProfile.primary_role || ""}, ${currentProfile.domain || ""}`.trim()}
                compatibility={currentProfile.compatibilityScore || 0}
                skills={currentProfile.skills.map(s => s.skill)}
                image={currentProfile.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80"}
                onUpgradeClick={() => showUpgradeModal('premium_match')}
              />
            ) : (
              <FounderCard
                key={currentProfile.id}
                name={currentProfile.full_name}
                age={currentProfile.age || 0}
                city={currentProfile.city || "Unknown"}
                role={`${currentProfile.primary_role || ""}, ${currentProfile.domain || ""}`.trim()}
                compatibility={currentProfile.compatibilityScore || 0}
                skills={currentProfile.skills.map(s => s.skill)}
                image={currentProfile.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80"}
                onSwipe={handleSwipe}
              />
            )}
            
            {calculatingScore && (
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground animate-pulse">
                  Calculating compatibility...
                </p>
              </div>
            )}
            
            <ActionButtons
              onPass={() => handleAction('pass')}
              onSuperLike={() => handleAction('superlike')}
              onLike={() => handleAction('like')}
              superLikeDisabled={!isPro}
              onSuperLikeDisabledClick={() => showUpgradeModal('super_like')}
            />
            
            {/* Swipe limit indicator - only show for free users */}
            {!isPro && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {remainingSwipes} / {dailyLimit} swipes left today
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary"
                    onClick={() => showUpgradeModal('swipe_limit')}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
                <Progress 
                  value={(remainingSwipes / dailyLimit) * 100} 
                  className="h-2 w-full"
                />
              </div>
            )}
            
            {isPro && (
              <div className="mt-6 flex items-center justify-center gap-2 text-teal">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Pro Member - Unlimited Swipes</span>
              </div>
            )}
            
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} of {profiles.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Swipe up for full profile
              </p>
            </div>
          </div>
        ) : null}

        {currentProfile && (
          <FounderProfileModal
            founder={{
              ...currentProfile,
              bio: currentProfile.startup_idea,
              linkedin_url: null,
              skills: currentProfile.skills.map(s => s.skill),
              compatibility: currentProfile.compatibilityScore || 0,
              compatibilityBreakdown: currentProfile.compatibilityBreakdown,
            }}
            open={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onPass={() => handleAction('pass')}
            onLike={() => handleAction('like')}
            isPro={isPro}
            onUpgradeClick={() => showUpgradeModal('compatibility_breakdown')}
          />
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          trigger={upgradeModalTrigger}
        />
      </main>

      {/* Footer hint */}
      <footer className="text-center pb-6 px-4">
        <p className="text-xs text-muted-foreground">
          Swipe to discover your perfect co-founder match
        </p>
      </footer>
    </div>
  );
};

export default Index;
