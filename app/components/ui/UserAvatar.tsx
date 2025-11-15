/**
 * UserAvatar Component
 *
 * Displays user initials in a colored circle when no profile picture is available.
 * Color is deterministic based on userId hash for consistency.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { User } from '../../types';

interface UserAvatarProps {
  user: Pick<User, 'nickname' | 'id' | 'photoURL'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Generate consistent color from userId
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Enduco-inspired pastel colors
  const colors: string[] = [
    '#10B981', // Green 500
    '#F59E0B', // Amber 500
    '#3B82F6', // Blue 500
    '#8B5CF6', // Purple 500
    '#EC4899', // Pink 500
    '#14B8A6', // Teal 500
    '#F97316', // Orange 500
    '#6366F1', // Indigo 500
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index]!;
}

// Extract initials from nickname
function getInitials(nickname: string): string {
  if (!nickname || nickname.trim().length === 0) {
    return '?';
  }

  const cleaned = nickname.trim();
  const words = cleaned.split(/\s+/);

  if (words.length === 1) {
    // Single word: take first 2 characters
    return cleaned.slice(0, 2).toUpperCase();
  }

  // Multiple words: take first character of first 2 words
  const first = words[0]?.[0];
  const second = words[1]?.[0];
  if (first && second) {
    return (first + second).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

const sizeStyles = {
  sm: { dimension: 32, textClass: 'text-sm' },
  md: { dimension: 48, textClass: 'text-base' },
  lg: { dimension: 64, textClass: 'text-lg' },
  xl: { dimension: 80, textClass: 'text-xl' },
} as const;

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const initials = useMemo(() => getInitials(user.nickname), [user.nickname]);
  const backgroundColor = useMemo(() => hashStringToColor(user.id), [user.id]);
  const [imageError, setImageError] = useState(false);
  const { dimension, textClass } = sizeStyles[size];

  // If user has photo URL, show image
  if (user.photoURL && !imageError) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border-2 border-white/20 ${className}`}
        style={{ width: dimension, height: dimension }}
        aria-label={`${user.nickname || 'User'}'s avatar`}
      >
        <Image
          src={user.photoURL}
          alt={user.nickname || 'User'}
          fill
          sizes={`${dimension}px`}
          className="object-cover"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Show initials with colored background
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${textClass} ${className}`}
      style={{ backgroundColor, width: dimension, height: dimension }}
      aria-label={`${user.nickname || 'User'}'s avatar`}
    >
      {initials}
    </div>
  );
}
