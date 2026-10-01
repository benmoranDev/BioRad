import React, { useEffect, useState } from 'react';
import { ThemeMode } from '../../types';

interface SplashScreenProps {
  onFinish: () => void;
  brandTitle?: string;
  brandSubtitle?: string;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  brandTitle = 'Biorad Cursos',
  brandSubtitle = 'Portal de Especialização em Radiologia & Tomografia Computadorizada',
  theme = 'dark',
  onToggleTheme
}) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Inicializando subsistemas de diagnóstico...');
  const [fadeOut, setFadeOut] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(25);
      setStageText('Carregando algoritmos de janelamento Hounsfield (HU)...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(55);
      setStageText('Sincronizando bancos de dados de protocolos de TC multislice...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(85);
      setStageText('Carregando grade curricular e simuladores práticos...');
    }, 1400);

    const timer4 = setTimeout(() => {
      setProgress(100);
      setStageText('Pronto! Conectando ao ambiente do aluno...');
    }, 1800);

    const timer5 = setTimeout(() => {
      setFadeOut(true);
    }, 2200);

    const timer6 = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-500 select-none overflow-hidden ${
        isDark
          ? 'bg-[#070b12] text-white'
          : 'bg-gradient-to-br from-slate-50 via-cyan-50/50 to-emerald-50/40 text-slate-900'
      } ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background ambient medical glows */}
      {isDark ? (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-300/35 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-emerald-300/30 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      {/* Grid overlay for medical radiology look */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark ? 'opacity-[0.04]' : 'opacity-[0.06]'
        }`}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 1px 1px, #4cd7f6 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, #0284c7 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Top right quick theme toggle */}
      {onToggleTheme && (
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-white/5 border-white/15 text-amber-300 hover:bg-white/10'
                : 'bg-white/90 border-slate-200 text-indigo-700 hover:bg-white shadow-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-[11px]">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Animated CT Gantry Icon Badge */}
        <div className="relative mb-6">
          <div
            className={`absolute -inset-3 rounded-3xl blur-xl opacity-75 animate-pulse ${
              isDark
                ? 'bg-gradient-to-tr from-[#06b6d4]/40 to-[#4edea3]/40'
                : 'bg-gradient-to-tr from-cyan-400/50 to-emerald-400/50'
            }`}
          />

          <div
            className={`relative w-24 h-24 rounded-3xl border flex items-center justify-center shadow-2xl transition-colors ${
              isDark
                ? 'bg-[#0e1626] border-[#4cd7f6]/40 shadow-[#4cd7f6]/20'
                : 'bg-white border-cyan-300 shadow-cyan-500/20'
            }`}
          >
            {/* Rotating Gantry Ring SVG */}
            <svg
              className="absolute inset-2 w-20 h-20 animate-spin"
              style={{ animationDuration: '8s' }}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isDark ? '#4cd7f6' : '#0891b2'}
                strokeWidth="2"
                strokeDasharray="6 8"
                opacity={isDark ? '0.6' : '0.7'}
              />
              <circle
                cx="50"
                cy="50"
                r="34"
                fill="none"
                stroke={isDark ? '#4edea3' : '#059669'}
                strokeWidth="1.5"
                strokeDasharray="14 10"
                opacity={isDark ? '0.8' : '0.9'}
              />
            </svg>

            {/* Central Imaging / Radiance Symbol */}
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#06b6d4] to-[#4edea3] flex items-center justify-center text-[#090d16] shadow-lg">
              <span className="material-symbols-outlined text-3xl font-black">
                radiology
              </span>
            </div>
          </div>
        </div>

        {/* Brand Name & Typography */}
        <div className="space-y-1 mb-6">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest font-bold mb-2 border shadow-sm ${
              isDark
                ? 'bg-cyan-500/10 border-cyan-400/30 text-[#4cd7f6]'
                : 'bg-cyan-100/80 border-cyan-300 text-cyan-900'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-ping ${
                isDark ? 'bg-[#4cd7f6]' : 'bg-cyan-600'
              }`}
            />
            <span>Sistema Hospitalar &amp; Ensino</span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] ${
              isDark
                ? 'bg-gradient-to-r from-white via-cyan-100 to-[#4cd7f6] bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-slate-900 via-cyan-900 to-emerald-800 bg-clip-text text-transparent'
            }`}
          >
            {brandTitle}
          </h1>
          <p
            className={`text-xs sm:text-sm font-medium max-w-xs mx-auto leading-snug ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {brandSubtitle}
          </p>
        </div>

        {/* Progress Bar & Stage Indicator */}
        <div className="w-full space-y-2 mt-3">
          <div
            className={`flex justify-between items-center text-[11px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span
              className={`truncate max-w-[280px] text-left flex items-center gap-1.5 font-medium ${
                isDark ? 'text-cyan-300/90' : 'text-cyan-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDark ? 'bg-cyan-400' : 'bg-cyan-600'
                }`}
              />
              {stageText}
            </span>
            <span
              className={`font-bold font-mono ${
                isDark ? 'text-[#4cd7f6]' : 'text-cyan-700'
              }`}
            >
              {progress}%
            </span>
          </div>

          <div
            className={`w-full h-2 rounded-full overflow-hidden p-[1px] border ${
              isDark
                ? 'bg-[#141f38] border-white/10'
                : 'bg-slate-200 border-slate-300 shadow-inner'
            }`}
          >
            <div
              className={`h-full bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#4edea3] rounded-full transition-all duration-300 ${
                isDark
                  ? 'shadow-[0_0_12px_#4cd7f6]'
                  : 'shadow-md shadow-cyan-500/30'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Student platform badges footer */}
        <div
          className={`mt-8 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'text-slate-500' : 'text-slate-500'
          }`}
        >
          <span className="flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs text-emerald-500">
              school
            </span>
            Portal 100% do Aluno
          </span>
          <span>•</span>
          <span className="font-semibold">Simulador TC &amp; RM</span>
          <span>•</span>
          <span className="font-semibold">Versão 2026.1</span>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={onFinish}
          className={`mt-6 text-[11px] font-mono transition-colors underline cursor-pointer ${
            isDark
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pular introdução [Enter]
        </button>
      </div>
    </div>
  );
};
