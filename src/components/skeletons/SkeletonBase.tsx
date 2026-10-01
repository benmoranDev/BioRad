import React from 'react';
import { ThemeMode } from '../../types';

interface SkeletonProps {
  className?: string;
  theme?: ThemeMode;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  theme = 'dark',
  variant = 'rounded',
  animate = true
}) => {
  const isDark = theme === 'dark';

  const baseVariant = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl'
  }[variant];

  return (
    <div
      className={`relative overflow-hidden ${baseVariant} ${
        isDark
          ? 'bg-slate-800/70 border border-white/5'
          : 'bg-slate-200/80 border border-slate-300/40'
      } ${animate ? 'animate-pulse' : ''} ${className}`}
    >
      {/* Shimmer reflection highlight */}
      <div
        className={`absolute inset-0 -translate-x-full bg-gradient-to-r ${
          isDark
            ? 'from-transparent via-white/[0.07] to-transparent'
            : 'from-transparent via-white/60 to-transparent'
        } animate-[shimmer_2s_infinite]`}
        style={{
          animation: 'shimmer 2s infinite linear'
        }}
      />
    </div>
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  theme?: ThemeMode;
  lastLineWidth?: string;
}> = ({ lines = 2, className = '', theme = 'dark', lastLineWidth = 'w-3/4' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          theme={theme}
          variant="text"
          className={`h-3.5 ${i === lines - 1 && lines > 1 ? lastLineWidth : 'w-full'}`}
        />
      ))}
    </div>
  );
};
