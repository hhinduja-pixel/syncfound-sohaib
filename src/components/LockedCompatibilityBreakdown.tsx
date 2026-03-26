import { Button } from "@/components/ui/button";
import { Lock, Crown, Eye, Users, Brain, Timer, Navigation, Heart } from "lucide-react";

interface LockedCompatibilityBreakdownProps {
  onUpgradeClick: () => void;
}

// Placeholder bar component showing locked state
function LockedBar({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 opacity-60">
      <div className="flex items-center gap-1.5 w-28 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-muted-foreground/30 rounded-full"
          style={{ width: '60%' }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-10 text-right">??%</span>
      <Lock className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

export function LockedCompatibilityBreakdown({ onUpgradeClick }: LockedCompatibilityBreakdownProps) {
  return (
    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border relative overflow-hidden">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-background/40 z-10 flex flex-col items-center justify-center p-4">
        <Lock className="h-8 w-8 text-primary mb-2" />
        <p className="text-sm font-medium text-foreground text-center mb-3">
          Unlock detailed insights
        </p>
        <Button 
          size="sm" 
          onClick={onUpgradeClick}
          className="bg-gradient-to-r from-primary to-teal hover:from-primary/90 hover:to-teal/90"
        >
          <Crown className="h-3 w-3 mr-1" />
          Upgrade to Pro
        </Button>
      </div>

      {/* Blurred content underneath */}
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Heart className="h-4 w-4 text-muted-foreground" />
        Compatibility Breakdown
      </h3>
      <div className="space-y-3">
        <LockedBar label="Vision Alignment" icon={<Eye className="h-3 w-3" />} />
        <LockedBar label="Skill Match" icon={<Users className="h-3 w-3" />} />
        <LockedBar label="Personality" icon={<Brain className="h-3 w-3" />} />
        <LockedBar label="Time Commitment" icon={<Timer className="h-3 w-3" />} />
        <LockedBar label="Location" icon={<Navigation className="h-3 w-3" />} />
      </div>
    </div>
  );
}
