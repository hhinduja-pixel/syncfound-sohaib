import { cn } from '@/lib/utils';

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
