import { useState } from 'react';
import { Package } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

export default function ArticleImage({ src, alt = 'Article', className = '' }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div className={`${className} bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500`} aria-label={`${alt} sans photo`}>
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
