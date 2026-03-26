import { ArrowLeft, ArrowUp, Heart, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionButtonsProps {
  onPass?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
  superLikeDisabled?: boolean;
  onSuperLikeDisabledClick?: () => void;
}

export const ActionButtons = ({ 
  onPass, 
  onSuperLike, 
  onLike,
  superLikeDisabled = false,
  onSuperLikeDisabledClick,
}: ActionButtonsProps) => {
  const handleSuperLikeClick = () => {
    if (superLikeDisabled && onSuperLikeDisabledClick) {
      onSuperLikeDisabledClick();
    } else if (onSuperLike) {
      onSuperLike();
    }
  };

  return (
    <div className="flex items-center justify-center gap-6 py-8">
      <Button
        variant="outline"
        size="icon"
        className="h-14 w-14 rounded-full border-2 hover:bg-muted transition-all"
        onClick={onPass}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`h-16 w-16 rounded-full border-2 transition-all relative ${
              superLikeDisabled 
                ? "opacity-60 border-muted cursor-pointer" 
                : "hover:bg-primary hover:text-primary-foreground"
            }`}
            onClick={handleSuperLikeClick}
          >
            <ArrowUp className="h-7 w-7" />
            {superLikeDisabled && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Crown className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </Button>
        </TooltipTrigger>
        {superLikeDisabled && (
          <TooltipContent>
            <p>Super Like requires Pro</p>
          </TooltipContent>
        )}
      </Tooltip>
      
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg"
        onClick={onLike}
      >
        <Heart className="h-6 w-6" />
      </Button>
    </div>
  );
};
