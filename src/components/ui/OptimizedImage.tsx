import { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // If true, skip lazy loading
}

/**
 * Optimized Image Component
 *
 * Features:
 * - Lazy loading by default
 * - WebP/AVIF support with fallback
 * - Async decoding
 * - Loading placeholder
 * - CLS prevention with aspect ratio
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate WebP/AVIF sources if original is JPG/PNG
  const generateSources = (originalSrc: string) => {
    const ext = originalSrc.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png'].includes(ext)) {
      return null;
    }

    const basePath = originalSrc.substring(0, originalSrc.lastIndexOf('.'));
    return (
      <picture>
        <source srcSet={`${basePath}.avif`} type="image/avif" />
        <source srcSet={`${basePath}.webp`} type="image/webp" />
        <img
          src={originalSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          {...props}
        />
      </picture>
    );
  };

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Image failed to load</span>
      </div>
    );
  }

  const sources = generateSources(src);
  if (sources) {
    return sources;
  }

  // Fallback for other image types
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

/**
 * Avatar Image with automatic sizing
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      priority={false}
    />
  );
}
