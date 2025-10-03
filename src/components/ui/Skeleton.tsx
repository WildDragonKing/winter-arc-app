import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className = '',
  ...props
}: SkeletonProps) {
  const styles: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '120px'),
    borderRadius:
      variant === 'circular'
        ? '50%'
        : variant === 'text'
        ? 'var(--radius-sm)'
        : 'var(--radius-md)',
  };

  return <div className={`skeleton ${className}`} style={styles} aria-busy="true" {...props} />;
}

// Card skeleton for tracking tiles
export function CardSkeleton() {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-lg"
      role="status"
      aria-label="Loading card content"
    >
      <div className="flex items-start justify-between mb-4">
        <Skeleton width="120px" height="24px" variant="text" />
        <Skeleton width="40px" height="40px" variant="circular" />
      </div>
      <Skeleton height="80px" className="mb-3" />
      <div className="flex gap-2">
        <Skeleton width="80px" height="36px" />
        <Skeleton width="80px" height="36px" />
      </div>
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4" role="status" aria-label="Loading list item">
      <Skeleton width="48px" height="48px" variant="circular" />
      <div className="flex-1">
        <Skeleton width="60%" height="20px" className="mb-2" variant="text" />
        <Skeleton width="40%" height="16px" variant="text" />
      </div>
    </div>
  );
}

// Text skeleton with multiple lines
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Loading text content">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height="16px"
          variant="text"
          className="mb-2"
        />
      ))}
    </div>
  );
}
