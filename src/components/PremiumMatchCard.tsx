import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Star } from "lucide-react";

interface PremiumMatchCardProps {
  name: string;
  age: number;
  city: string;
  role: string;
  compatibility: number;
  skills: string[];
  image: string;
  onUpgradeClick: () => void;
}

export const PremiumMatchCard = ({
  name,
  age,
  city,
  role,
  compatibility,
  skills,
  image,
  onUpgradeClick,
}: PremiumMatchCardProps) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compatibility / 100) * circumference;

  return (
    <div className="bg-card rounded-3xl shadow-lg overflow-hidden max-w-sm w-full relative">
      {/* Premium Badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className="bg-gradient-to-r from-primary to-teal text-primary-foreground border-0 gap-1">
          <Star className="h-3 w-3" />
          Premium Match
        </Badge>
      </div>

      <div className="relative h-96 overflow-hidden">
        {/* Blurred Image */}
        <img
          src={image}
          alt="Premium match"
          className="w-full h-full object-cover blur-xl scale-110"
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
        
        {/* Lock Icon and Message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-teal/20 flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">
            {compatibility}% Match!
          </h3>
          
          <p className="text-muted-foreground text-sm mb-6 max-w-[250px]">
            This founder is a premium match with high compatibility. Upgrade to Pro to unlock!
          </p>
          
          <Button 
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-primary to-teal hover:from-primary/90 hover:to-teal/90"
          >
            <Crown className="h-4 w-4 mr-2" />
            Unlock with Pro
          </Button>
        </div>
        
        {/* Compatibility Ring (shown but locked) */}
        <div className="absolute bottom-4 right-4 opacity-50">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="hsl(var(--muted))"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="hsl(var(--teal))"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{compatibility}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
