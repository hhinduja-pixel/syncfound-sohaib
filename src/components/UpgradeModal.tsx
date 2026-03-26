import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Star, ArrowUp, Eye, Lock } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  trigger: 'swipe_limit' | 'super_like' | 'compatibility_breakdown' | 'premium_match';
}

const triggerMessages = {
  swipe_limit: {
    title: "Daily Limit Reached",
    description: "You've used all 10 swipes for today. Upgrade to Pro for unlimited swipes!",
    icon: Zap,
  },
  super_like: {
    title: "Super Like is Pro Only",
    description: "Super Likes help you stand out! Upgrade to Pro for unlimited Super Likes.",
    icon: ArrowUp,
  },
  compatibility_breakdown: {
    title: "Unlock Detailed Insights",
    description: "See the full compatibility breakdown to understand why you match. Upgrade to Pro!",
    icon: Eye,
  },
  premium_match: {
    title: "Premium Match Found!",
    description: "This founder has 85%+ compatibility with you. Upgrade to Pro to connect with top matches!",
    icon: Star,
  },
};

const proFeatures = [
  { icon: Zap, text: "Unlimited daily swipes" },
  { icon: ArrowUp, text: "Unlimited Super Likes" },
  { icon: Eye, text: "Detailed compatibility insights" },
  { icon: Star, text: "Access to premium matches (85%+)" },
];

export function UpgradeModal({ open, onClose, trigger }: UpgradeModalProps) {
  const { title, description, icon: TriggerIcon } = triggerMessages[trigger];

  const handleUpgrade = () => {
    // TODO: Integrate with Razorpay
    console.log("Upgrade clicked - Razorpay integration pending");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-teal/20 flex items-center justify-center">
            <TriggerIcon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-teal/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Pro Plan</span>
              <span className="ml-auto text-lg font-bold text-primary">₹499/mo</span>
            </div>
            
            <ul className="space-y-2">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <feature.icon className="h-4 w-4 text-teal" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>

          <Button 
            onClick={handleUpgrade} 
            className="w-full bg-gradient-to-r from-primary to-teal hover:from-primary/90 hover:to-teal/90"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          
          <Button variant="ghost" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
