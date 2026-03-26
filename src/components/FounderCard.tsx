import { Badge } from "@/components/ui/badge";
import { useSpring, animated } from "react-spring";
import { useDrag } from "@use-gesture/react";

interface FounderCardProps {
  name: string;
  age: number;
  city: string;
  role: string;
  compatibility: number;
  skills: string[];
  image: string;
  onSwipe?: (direction: 'left' | 'right' | 'up') => void;
}

export const FounderCard = ({ 
  name, 
  age, 
  city, 
  role, 
  compatibility, 
  skills,
  image,
  onSwipe
}: FounderCardProps) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compatibility / 100) * circumference;

  const [{ x, y, rotate, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [xDir], velocity: [vx, vy] }) => {
      const triggerX = vx > 0.2 || Math.abs(mx) > 100;
      const triggerY = vy > 0.2 && my < -80;
      
      if (!active && triggerY) {
        // Swipe up - open profile
        api.start({
          y: 0,
          x: 0,
          rotate: 0,
          opacity: 1,
          config: { tension: 400, friction: 40 },
        });
        onSwipe?.('up');
      } else if (!active && triggerX) {
        const dir = xDir < 0 ? -1 : 1;
        api.start({
          x: dir * 1000,
          y: 0,
          rotate: dir * 20,
          opacity: 0,
          config: { tension: 200, friction: 20 },
        });
        setTimeout(() => {
          onSwipe?.(dir < 0 ? 'left' : 'right');
        }, 300);
      } else {
        api.start({
          x: active ? mx : 0,
          y: active ? Math.min(my, 0) : 0,
          rotate: active ? mx / 20 : 0,
          opacity: 1,
          config: { tension: 400, friction: 40 },
        });
      }
    },
    {}
  );

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        rotate,
        opacity,
        touchAction: 'none',
      }}
      className="bg-card rounded-3xl shadow-lg overflow-hidden max-w-sm w-full cursor-grab active:cursor-grabbing relative"
    >
      <animated.div
        style={{
          opacity: x.to((val) => 1 - Math.abs(val) / 500),
        }}
        className="absolute top-8 left-8 text-6xl font-bold text-red-500 rotate-[-20deg] z-10 opacity-0"
      >
        PASS
      </animated.div>
      <animated.div
        style={{
          opacity: x.to((val) => (val > 0 ? val / 500 : 0)),
        }}
        className="absolute top-8 right-8 text-6xl font-bold text-green-500 rotate-[20deg] z-10 opacity-0"
      >
        LIKE
      </animated.div>
      
      <div className="relative h-96 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/90" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-1">{name}</h2>
              <p className="text-muted-foreground text-sm mb-2">
                {age}, {city}
              </p>
              <p className="text-xs text-muted-foreground mb-3">{role}</p>
            </div>
            
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
          
          <div className="flex flex-wrap gap-2 mt-4">
            {skills.slice(0, 5).map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-card/80 backdrop-blur-sm border border-border text-foreground text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </animated.div>
  );
};
