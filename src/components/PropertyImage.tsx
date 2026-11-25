import { useState } from 'react';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function PropertyImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-gradient-to-br from-surface-container-high via-surface-container to-secondary-container/40 flex flex-col items-center justify-center p-3 text-center text-on-surface-variant"
      >
        <span className="material-symbols-outlined text-headline-md mb-1" aria-hidden="true">
          apartment
        </span>
        {fallbackLabel && (
          <span className="text-label-sm font-medium line-clamp-1">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
