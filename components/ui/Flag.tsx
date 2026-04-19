import type { Jurisdiction } from '@/lib/types';

const JURISDICTION_FLAGS: Record<Jurisdiction, { emoji: string; label: string }> = {
  US: { emoji: '🇺🇸', label: 'United States' },
  UK: { emoji: '🇬🇧', label: 'United Kingdom' },
  EU: { emoji: '🇪🇺', label: 'European Union' },
  IN: { emoji: '🇮🇳', label: 'India' },
  CA: { emoji: '🇨🇦', label: 'Canada' },
  SG: { emoji: '🇸🇬', label: 'Singapore' },
  HK: { emoji: '🇭🇰', label: 'Hong Kong' },
};

interface Props {
  jurisdiction: Jurisdiction;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASS = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

export default function Flag({ jurisdiction, size = 'md', showLabel = false, className }: Props) {
  const f = JURISDICTION_FLAGS[jurisdiction];
  if (!f) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      <span aria-hidden className={`leading-none ${SIZE_CLASS[size]}`}>
        {f.emoji}
      </span>
      {showLabel ? <span>{f.label}</span> : <span className="sr-only">{f.label}</span>}
    </span>
  );
}
