import React from 'react';
import { ThemeMode } from '../../types';
import { Skeleton, SkeletonText } from './SkeletonBase';

interface ClassroomSkeletonProps {
  theme?: ThemeMode;
}

export const ClassroomSkeleton: React.FC<ClassroomSkeletonProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div
      aria-busy="true"
      aria-label="Carregando Sala de Aula Virtual..."
      className="p-4 sm:p-6 lg:p-8 max-w-[1760px] mx-auto space-y-6 animate-fade-in"
    >
      {/* 1. COURSE SELECTOR & INSTRUCTOR MANAGEMENT HEADER SKELETON */}
      <section
        className={`p-5 sm:p-7 rounded-[36px] border shadow-xl backdrop-blur-2xl ${
          isDark
            ? 'bg-gradient-to-r from-[#141f38]/90 via-[#18233a] to-[#0f172a] border-cyan-500/30'
            : 'bg-gradient-to-r from-cyan-50/90 via-white to-emerald-50/80 border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-wrap min-w-0">
            {/* Circle icon */}
            <Skeleton theme={theme} variant="circular" className="w-12 h-12 shrink-0" />

            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton theme={theme} className="h-4 w-44 rounded-full" />
                <Skeleton theme={theme} className="h-5 w-32 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton theme={theme} className="h-4 w-28 rounded" />
                <Skeleton theme={theme} className="h-8 w-64 sm:w-80 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Skeleton theme={theme} className="h-9 w-32 rounded-full" />
            <Skeleton theme={theme} className="h-9 w-44 rounded-full" />
          </div>
        </div>
      </section>

      {/* 2. MAIN PLAYER & CONTENT GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Video Player & Tabs (8 cols) */}
        <section className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* Interactive Video Player Container Skeleton */}
          <div className="relative rounded-[36px] overflow-hidden bg-[#0a0e17] border border-white/15 shadow-[0_12px_45px_-5px_rgba(0,0,0,0.8)] ring-1 ring-[#4cd7f6]/25">
            <div className="relative w-full aspect-video bg-black/90 flex flex-col justify-between p-4 sm:p-6">
              {/* Top HUD bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Skeleton theme={theme} className="h-6 w-28 rounded-full" />
                  <Skeleton theme={theme} className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton theme={theme} className="h-6 w-24 rounded-full" />
              </div>

              {/* Center Play button placeholder */}
              <div className="self-center flex flex-col items-center gap-3">
                <Skeleton theme={theme} variant="circular" className="w-16 h-16 sm:w-20 sm:h-20" />
                <Skeleton theme={theme} className="h-4 w-32 rounded-full" />
              </div>

              {/* Bottom Video Controls Skeleton */}
              <div className="space-y-3 z-10">
                {/* Progress bar */}
                <Skeleton theme={theme} className="h-2 w-full rounded-full" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton theme={theme} variant="circular" className="w-8 h-8" />
                    <Skeleton theme={theme} className="h-4 w-20 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton theme={theme} className="h-6 w-14 rounded-full" />
                    <Skeleton theme={theme} variant="circular" className="w-8 h-8" />
                    <Skeleton theme={theme} variant="circular" className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Tabs & Lesson Description Card */}
          <div
            className={`p-6 sm:p-7 rounded-[36px] border shadow-xl backdrop-blur-2xl space-y-6 ${
              isDark ? 'bg-[#141c2e]/80 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {/* Tabs Header */}
            <div className="flex items-center gap-2 pb-4 border-b border-white/10 overflow-x-auto">
              <Skeleton theme={theme} className="h-9 w-32 rounded-2xl shrink-0" />
              <Skeleton theme={theme} className="h-9 w-36 rounded-2xl shrink-0" />
              <Skeleton theme={theme} className="h-9 w-32 rounded-2xl shrink-0" />
              <Skeleton theme={theme} className="h-9 w-28 rounded-2xl shrink-0" />
            </div>

            {/* Lesson Title & Header Details */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton theme={theme} className="h-5 w-20 rounded-full" />
                    <Skeleton theme={theme} className="h-4 w-24 rounded" />
                  </div>
                  <Skeleton theme={theme} className="h-7 sm:h-8 w-4/5 rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton theme={theme} className="h-9 w-36 rounded-full" />
                </div>
              </div>

              {/* Instructor profile bar */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <Skeleton theme={theme} variant="circular" className="w-10 h-10 shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton theme={theme} className="h-4 w-40 rounded" />
                  <Skeleton theme={theme} className="h-3 w-56 rounded" />
                </div>
              </div>

              {/* Description body text */}
              <SkeletonText lines={3} theme={theme} lastLineWidth="w-2/3" className="pt-2" />

              {/* Attached materials */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <Skeleton theme={theme} className="h-4 w-36 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton theme={theme} className="h-14 w-full rounded-2xl" />
                  <Skeleton theme={theme} className="h-14 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Roadmap & Modules (4 cols) */}
        <section className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div
            className={`p-5 rounded-3xl border shadow-xl backdrop-blur-2xl flex flex-col flex-1 space-y-4 ${
              isDark ? 'bg-[#141c2e]/80 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {/* Panel Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Skeleton theme={theme} className="h-8 flex-1 rounded-2xl" />
              <Skeleton theme={theme} className="h-8 flex-1 rounded-2xl" />
            </div>

            {/* Course Roadmap Lesson Items */}
            <div className="space-y-3 flex-1">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                    idx === 0
                      ? isDark
                        ? 'bg-cyan-500/15 border-cyan-400/40'
                        : 'bg-cyan-50 border-cyan-300'
                      : isDark
                        ? 'bg-[#0a0e17]/60 border-white/5'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Skeleton theme={theme} variant="rounded" className="w-7 h-7 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton theme={theme} className="h-4 w-4/5 rounded" />
                      <div className="flex items-center gap-2">
                        <Skeleton theme={theme} className="h-3 w-16 rounded" />
                        <Skeleton theme={theme} className="h-3 w-12 rounded" />
                      </div>
                    </div>
                  </div>
                  <Skeleton theme={theme} variant="circular" className="w-5 h-5 shrink-0" />
                </div>
              ))}
            </div>

            {/* Certificate Progress Card Skeleton */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <Skeleton theme={theme} className="h-4 w-28 rounded" />
                <Skeleton theme={theme} className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton theme={theme} className="h-2 w-full rounded-full" />
              <Skeleton theme={theme} className="h-8 w-full rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
