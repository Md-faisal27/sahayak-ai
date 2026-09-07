'use client';

import React from 'react';

interface TopicBadgeProps {
  topic: string;
  classification: 'STRONG' | 'AVERAGE' | 'WEAK';
  score?: number;
}

export function TopicBadge({ topic, classification, score }: TopicBadgeProps) {
  const styles = {
    STRONG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    AVERAGE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    WEAK: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[classification]}`}>
      <span>{topic}</span>
      {score !== undefined && <span className="opacity-80 font-normal">({score}%)</span>}
    </span>
  );
}
