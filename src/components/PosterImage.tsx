import { useState } from 'react';
import { Film } from 'lucide-react';

interface PosterImageProps {
  src?: string;
  alt: string;
  title: string;
  className?: string;
  aspect?: 'poster' | 'banner';
}

export function PosterImage({
  src,
  alt,
  title,
  className = '',
  aspect = 'poster',
}: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-[#1D1720] via-[#131318] to-[#0D0D11] text-center p-4 select-none overflow-hidden ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-11 h-11 rounded-xl bg-rose-600/15 border border-rose-500/25 flex items-center justify-center mb-3 text-rose-400">
          <Film className="w-5 h-5" />
        </div>
        <p className="font-display font-semibold text-sm text-zinc-200 line-clamp-2 max-w-[16ch]">
          {title}
        </p>
        {aspect === 'banner' && (
          <p className="text-xs text-zinc-500 mt-1">CineBook AI Feature Presentation</p>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
