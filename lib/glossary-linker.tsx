'use client';

import React from 'react';
import Link from 'next/link';
import { GLOSSARY } from './glossary';

// Build a single regex that matches any glossary term — case-insensitive,
// word-boundary aware. The result is reused across every render.
const TERMS = GLOSSARY.map((g) => g.term).sort((a, b) => b.length - a.length);
const ESCAPED = TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const TERM_REGEX = new RegExp(`\\b(${ESCAPED.join('|')})\\b`, 'gi');

const BY_LOWER = new Map(GLOSSARY.map((g) => [g.term.toLowerCase(), g]));

/**
 * Render a string with every glossary-known term linked to /glossary#<category>.
 * The bare-text fallback is returned if no term matches, so this is safe to
 * use everywhere we currently render `r.applicabilityReason`.
 */
export function linkGlossaryTerms(text: string): React.ReactNode {
  if (!text) return text;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  TERM_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TERM_REGEX.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const matched = match[0];
    const entry = BY_LOWER.get(matched.toLowerCase());
    if (entry) {
      parts.push(
        <Link
          key={`${start}-${matched}`}
          href={`/glossary#${entry.category.toLowerCase()}`}
          title={entry.expansion ?? entry.body.slice(0, 90)}
          className="border-b border-dashed border-brand-400 text-brand-700 hover:border-brand-600 dark:text-brand-300"
        >
          {matched}
        </Link>,
      );
    } else {
      parts.push(matched);
    }
    lastIndex = start + matched.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}
