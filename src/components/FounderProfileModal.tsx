import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, Briefcase, Clock, Target, Brain, Lightbulb, Linkedin, Eye, Users, Heart, Timer, Navigation } from "lucide-react";
import { LockedCompatibilityBreakdown } from "./LockedCompatibilityBreakdown";

interface CompatibilityBreakdown {
  visionAlignment: number;
  skillComplementarity: number;
  personalityMatch: number;
  timeCommitmentMatch: number;
  locationProximity: number;
  explanation: string;
}

interface FounderProfile {
  id: string;
  full_name: string;
  age: number | null;
  city: string | null;
  primary_role: string | null;
  secondary_role: string | null;
  bio: string | null;
  startup_idea: string | null;
  domain: string | null;
  time_commitment: string | null;
  funding_stage: string | null;
  mbti: string | null;
  work_style: string | null;
  risk_appetite: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  skills: string[];
  compatibility: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
}

interface FounderProfileModalProps {
  founder: FounderProfile | null;
  open: boolean;
  onClose: () => void;
  onPass: () => void;
  onLike: () => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

// Compatibility bar component
function CompatibilityBar({ label, value, weight, icon }: { label: string; value: number; weight: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-28 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-teal to-teal/70 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-10 text-right">{value}%</span>
      <span className="text-[10px] text-muted-foreground w-8">({weight})</span>
    </div>
  );
}

export function FounderProfileModal({ 
  founder, 
  open, 
  onClose, 
  onPass, 
  onLike,
  isPro = false,
  onUpgradeClick,
}: FounderProfileModalProps) {
  if (!founder) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (founder.compatibility / 100) * circumference;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-card border-border">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <ScrollArea className="max-h-[85vh]">
          {/* Hero Image */}
          <div className="relative h-72">
            <img
              src={founder.avatar_url || '/placeholder.svg'}
              alt={founder.full_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            
            {/* Compatibility Ring */}
            <div className="absolute bottom-4 right-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="hsl(var(--muted))"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="hsl(var(--teal))"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{founder.compatibility}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Compatibility Breakdown */}
            {/* Compatibility Breakdown - Locked for free users */}
            {founder.compatibilityBreakdown && isPro ? (
              <div className="bg-gradient-to-br from-teal/10 to-primary/5 rounded-xl p-4 border border-teal/20">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-teal" />
                  Compatibility Breakdown
                </h3>
                <div className="space-y-3">
                  <CompatibilityBar 
                    label="Vision Alignment" 
                    value={founder.compatibilityBreakdown.visionAlignment} 
                    weight="30%"
                    icon={<Eye className="h-3 w-3" />}
                  />
                  <CompatibilityBar 
                    label="Skill Match" 
                    value={founder.compatibilityBreakdown.skillComplementarity} 
                    weight="25%"
                    icon={<Users className="h-3 w-3" />}
                  />
                  <CompatibilityBar 
                    label="Personality" 
                    value={founder.compatibilityBreakdown.personalityMatch} 
                    weight="20%"
                    icon={<Brain className="h-3 w-3" />}
                  />
                  <CompatibilityBar 
                    label="Time Commitment" 
                    value={founder.compatibilityBreakdown.timeCommitmentMatch} 
                    weight="15%"
                    icon={<Timer className="h-3 w-3" />}
                  />
                  <CompatibilityBar 
                    label="Location" 
                    value={founder.compatibilityBreakdown.locationProximity} 
                    weight="10%"
                    icon={<Navigation className="h-3 w-3" />}
                  />
                </div>
                {founder.compatibilityBreakdown.explanation && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    "{founder.compatibilityBreakdown.explanation}"
                  </p>
                )}
              </div>
            ) : (
              <LockedCompatibilityBreakdown onUpgradeClick={onUpgradeClick || (() => {})} />
            )}
            {/* Name & Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{founder.full_name}</h2>
                {founder.age && <span className="text-muted-foreground">{founder.age}</span>}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {founder.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {founder.city}
                  </span>
                )}
                {founder.primary_role && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {founder.primary_role}
                    {founder.secondary_role && ` / ${founder.secondary_role}`}
                  </span>
                )}
              </div>

              {founder.linkedin_url && (
                <a 
                  href={founder.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </a>
              )}
            </div>

            {/* Bio */}
            {founder.bio && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
                <p className="text-foreground">{founder.bio}</p>
              </div>
            )}

            {/* Startup Idea */}
            {founder.startup_idea && (
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-teal" />
                  <h3 className="text-sm font-medium text-foreground">Startup Idea</h3>
                </div>
                <p className="text-muted-foreground text-sm">{founder.startup_idea}</p>
              </div>
            )}

            {/* Skills */}
            {founder.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {founder.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-secondary/50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {founder.domain && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Domain</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{founder.domain}</span>
                </div>
              )}
              
              {founder.time_commitment && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Commitment</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{founder.time_commitment}</span>
                </div>
              )}
              
              {founder.funding_stage && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Stage</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{founder.funding_stage}</span>
                </div>
              )}
              
              {founder.mbti && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">MBTI</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{founder.mbti}</span>
                </div>
              )}
            </div>

            {/* Work Style & Risk */}
            {(founder.work_style || founder.risk_appetite) && (
              <div className="space-y-2">
                {founder.work_style && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work Style</span>
                    <span className="text-foreground">{founder.work_style}</span>
                  </div>
                )}
                {founder.risk_appetite && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Appetite</span>
                    <span className="text-foreground">{founder.risk_appetite}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { onPass(); onClose(); }}
              >
                Pass
              </Button>
              <Button 
                className="flex-1 bg-teal hover:bg-teal/90"
                onClick={() => { onLike(); onClose(); }}
              >
                Like
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
