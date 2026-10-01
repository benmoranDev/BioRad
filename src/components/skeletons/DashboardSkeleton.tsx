import React from 'react';
import { ThemeMode } from '../../types';
import { Skeleton, SkeletonText } from './SkeletonBase';

interface DashboardSkeletonProps {
  theme?: ThemeMode;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div
      aria-busy="true"
      aria-label="Carregando Dashboard Acadêmico..."
      className="p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto space-y-7 animate-fade-in"
    >
      {/* SECTION 1: Liquid Glass Welcome Banner / Hero Skeleton */}
      <section
        className={`relative overflow-hidden rounded-[36px] backdrop-blur-2xl border p-6 sm:p-8 ${
          isDark
            ? 'bg-gradient-to-r from-[#141f38]/80 via-[#181b25]/90 to-[#141f38]/70 border-white/10 shadow-[0_12px_40px_-4px_rgba(0,0,0,0.65)] ring-1 ring-[#4cd7f6]/20'
            : 'bg-gradient-to-r from-cyan-50/80 via-white to-sky-50/70 border-slate-200/90 shadow-md ring-1 ring-cyan-500/20'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl w-full">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton theme={theme} className="h-6 w-48 rounded-full" />
              <Skeleton theme={theme} className="h-6 w-36 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton theme={theme} className="h-9 sm:h-11 w-3/4 rounded-2xl" />

            {/* Subtitle text */}
            <SkeletonText lines={2} theme={theme} className="max-w-xl pt-1" lastLineWidth="w-4/5" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Skeleton theme={theme} className="h-10 w-44 rounded-full" />
            <Skeleton theme={theme} className="h-10 w-36 rounded-full" />
            <Skeleton theme={theme} className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </section>

      {/* SECTION 2: Metrics Row (4 Bento Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-[28px] backdrop-blur-2xl border shadow-xl relative overflow-hidden ${
              isDark
                ? 'bg-[#141f38]/50 border-white/10'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton theme={theme} className="h-4 w-28 rounded" />
              <Skeleton theme={theme} variant="circular" className="w-8 h-8" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton theme={theme} className="h-8 w-16 rounded-lg" />
              <Skeleton theme={theme} className="h-4 w-12 rounded" />
            </div>
            <div className="mt-3 pt-1">
              <Skeleton theme={theme} className="h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </section>

      {/* SECTION 3: Próxima Aula ao Vivo */}
      <section>
        <div
          className={`p-6 sm:p-7 rounded-[36px] backdrop-blur-2xl border shadow-2xl relative overflow-hidden ${
            isDark
              ? 'bg-[#141f38]/60 border-white/10 shadow-black/40'
              : 'bg-gradient-to-r from-cyan-50/40 via-white to-emerald-50/40 border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
              {/* Video Thumbnail placeholder */}
              <Skeleton theme={theme} className="w-full sm:w-44 aspect-video rounded-[24px] shrink-0" />

              <div className="space-y-2.5 w-full max-w-2xl">
                <div className="flex items-center gap-2">
                  <Skeleton theme={theme} className="h-5 w-32 rounded-full" />
                  <Skeleton theme={theme} className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton theme={theme} className="h-6 w-5/6 rounded-lg" />
                <Skeleton theme={theme} className="h-4 w-1/2 rounded" />
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0">
              <Skeleton theme={theme} className="h-11 w-full lg:w-48 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* LEFT COLUMN: Disciplinas em Andamento (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div
            className={`p-6 sm:p-7 rounded-[36px] backdrop-blur-2xl border shadow-xl space-y-5 ${
              isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/20">
              <div className="space-y-1.5">
                <Skeleton theme={theme} className="h-6 w-48 rounded-lg" />
                <Skeleton theme={theme} className="h-3.5 w-72 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton theme={theme} className="h-7 w-16 rounded-full" />
                <Skeleton theme={theme} className="h-7 w-20 rounded-full" />
                <Skeleton theme={theme} className="h-7 w-24 rounded-full" />
              </div>
            </div>

            {/* Course Card Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-[28px] border space-y-4 ${
                    isDark ? 'bg-[#0e1424]/80 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton theme={theme} className="h-3.5 w-20 rounded" />
                      <Skeleton theme={theme} className="h-5 w-4/5 rounded-lg" />
                    </div>
                    <Skeleton theme={theme} variant="circular" className="w-10 h-10 shrink-0" />
                  </div>

                  <SkeletonText lines={2} theme={theme} lastLineWidth="w-3/5" />

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <Skeleton theme={theme} className="h-3 w-16 rounded" />
                      <Skeleton theme={theme} className="h-3 w-10 rounded" />
                    </div>
                    <Skeleton theme={theme} className="h-2 w-full rounded-full" />
                  </div>

                  {/* Bottom Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Skeleton theme={theme} variant="circular" className="w-6 h-6" />
                      <Skeleton theme={theme} className="h-3 w-24 rounded" />
                    </div>
                    <Skeleton theme={theme} className="h-7 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Trabalhos + Notas (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Trabalhos Pendentes */}
          <div
            className={`p-6 rounded-[36px] backdrop-blur-2xl border shadow-xl space-y-4 ${
              isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <Skeleton theme={theme} className="h-5 w-36 rounded-lg" />
              <Skeleton theme={theme} className="h-5 w-20 rounded-full" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-[24px] border space-y-2 ${
                    isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Skeleton theme={theme} className="h-3 w-24 rounded" />
                    <Skeleton theme={theme} className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton theme={theme} className="h-4 w-4/5 rounded" />
                  <div className="flex justify-between items-center pt-1">
                    <Skeleton theme={theme} className="h-3 w-28 rounded" />
                    <Skeleton theme={theme} className="h-3 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>

            <Skeleton theme={theme} className="h-9 w-full rounded-full" />
          </div>

          {/* Card 2: Últimas Notas */}
          <div
            className={`p-6 rounded-[36px] backdrop-blur-2xl border shadow-xl space-y-4 ${
              isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <Skeleton theme={theme} className="h-5 w-32 rounded-lg" />
              <Skeleton theme={theme} className="h-5 w-24 rounded-full" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-[20px] border flex items-center justify-between ${
                    isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <Skeleton theme={theme} className="h-3.5 w-3/4 rounded" />
                    <Skeleton theme={theme} className="h-3 w-1/2 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton theme={theme} className="h-5 w-10 rounded ml-auto" />
                    <Skeleton theme={theme} className="h-2.5 w-14 rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>

            <Skeleton theme={theme} className="h-9 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
