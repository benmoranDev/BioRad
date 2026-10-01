import React, { useState, useMemo } from 'react';
import { RADIOLOGY_GLOSSARY_TERMS, GlossaryTerm } from '../../data/radiologyGlossaryData';
import { playCanonAudioCue } from '../../utils/dicomEngine';

interface RadiologyGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

export const RadiologyGlossaryModal: React.FC<RadiologyGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialTermId = 'kvp'
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTermId, setActiveTermId] = useState<string>(initialTermId);

  // Filtered terms based on search and category
  const filteredTerms = useMemo(() => {
    return RADIOLOGY_GLOSSARY_TERMS.filter(term => {
      const matchesCategory = selectedCategory === 'ALL' || term.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (term.abbreviation && term.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        term.shortDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.detailedExplanation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  // Currently active selected term
  const activeTerm = useMemo(() => {
    return (
      RADIOLOGY_GLOSSARY_TERMS.find(t => t.id === activeTermId) ||
      filteredTerms[0] ||
      RADIOLOGY_GLOSSARY_TERMS[0]
    );
  }, [activeTermId, filteredTerms]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm select-none font-sans text-gray-200 animate-fade-in">
      {/* Industrial Hardware Console Modal Container */}
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[800px] bg-[#1a1e2a] rounded-sm border-t-2 border-l-2 border-[#546080] border-b-4 border-r-4 border-[#0c0e14] shadow-[0_0_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-xs">
        
        {/* ===================== MODAL HEADER ===================== */}
        <header className="h-12 bg-gradient-to-r from-[#242a3a] via-[#2e3649] to-[#242a3a] border-b-2 border-[#12151e] px-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-[#12151e] border border-cyan-500/60 flex items-center justify-center text-cyan-300 shadow-inner">
              <span className="material-symbols-outlined text-base">menu_book</span>
            </div>
            <div>
              <div className="text-white font-black text-sm font-mono tracking-tight flex items-center gap-2">
                <span>GLOSSÁRIO TÉCNICO RADIOLÓGICO & FÍSICO DE TC</span>
                <span className="text-[10px] text-cyan-300 font-bold bg-[#141b29] px-1.5 py-0.2 rounded border border-cyan-500/40">
                  Canon Academy
                </span>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                Conceitos essenciais de aquisição, dosimetria ALARA, geometria e pós-processamento MPR
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playCanonAudioCue('click');
              onClose();
            }}
            className="px-3 py-1 rounded-sm bg-red-600 hover:bg-red-500 active:scale-95 text-white border border-red-400 font-mono text-[11px] font-black flex items-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.7)] cursor-pointer"
            title="Fechar Glossário"
          >
            <span className="material-symbols-outlined text-sm leading-none font-bold">close</span>
            <span>FECHAR</span>
          </button>
        </header>

        {/* ===================== FILTER & SEARCH BAR ===================== */}
        <div className="bg-[#1e2331] border-b border-[#363f54] px-4 py-2 flex flex-col sm:flex-row gap-2 items-center justify-between shrink-0 font-mono">
          {/* Search Input Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar termo, sigla ou fórmula (ex: kVp, FOV, MPR, HU)..."
              className="w-full bg-[#12151e] border border-[#485470] rounded-sm pl-8 pr-3 py-1 text-white text-[11px] placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              search
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-[10px]">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'EXPOSURE', label: 'Exposição (kVp/mAs)' },
              { id: 'GEOMETRY', label: 'Geometria & Imagem' },
              { id: 'DOSIMETRY', label: 'Dosimetria (CTDI/DLP)' },
              { id: 'RECONSTRUCTION', label: 'Reconstrução & MPR' },
              { id: 'CONTRAST', label: 'Contraste & Bolus' },
              { id: 'HARDWARE', label: 'Hardware & Gantry' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  playCanonAudioCue('click');
                  setSelectedCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded-sm border font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                    : 'bg-[#141822] text-gray-400 border-[#323b4e] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===================== MAIN 2-PANEL CONTENT ===================== */}
        <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden bg-[#131620]">
          
          {/* ----------------- LEFT SIDEBAR: TERM LIST (4 Cols) ----------------- */}
          <div className="col-span-12 md:col-span-4 bg-[#1b202c] border-r-2 border-[#12151e] overflow-y-auto p-2 space-y-1 shadow-inner">
            <div className="text-[9px] font-mono text-gray-400 px-1 font-bold flex justify-between">
              <span>TERMOS RADIOLÓGICOS ({filteredTerms.length}):</span>
              <span className="text-cyan-400">Guia Rápido</span>
            </div>

            {filteredTerms.map(term => (
              <div
                key={term.id}
                onClick={() => {
                  playCanonAudioCue('click');
                  setActiveTermId(term.id);
                }}
                className={`p-2 rounded-sm border transition-all cursor-pointer ${
                  activeTerm.id === term.id
                    ? 'bg-gradient-to-r from-[#2c374d] to-[#222b3d] text-white border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-[#161a24] hover:bg-[#1f2533] text-gray-300 border-[#30384a]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[11px] text-white tracking-tight flex items-center gap-1.5">
                    {term.abbreviation && (
                      <span className="px-1.5 py-0.2 rounded bg-[#0e1118] text-cyan-300 font-mono text-[9px] font-black border border-cyan-500/30">
                        {term.abbreviation}
                      </span>
                    )}
                    <span className="truncate">{term.term}</span>
                  </span>
                </div>
                <div className="text-[9px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                  {term.shortDefinition}
                </div>
              </div>
            ))}

            {filteredTerms.length === 0 && (
              <div className="p-6 text-center text-gray-500 space-y-2 font-mono">
                <span className="material-symbols-outlined text-3xl">search_off</span>
                <div className="text-xs">Nenhum termo encontrado para "{searchTerm}"</div>
              </div>
            )}
          </div>

          {/* ----------------- RIGHT PANEL: DETAILED TERM INSPECTOR (8 Cols) ----------------- */}
          <div className="col-span-12 md:col-span-8 bg-[#151922] p-4 overflow-y-auto space-y-3 font-sans">
            {activeTerm && (
              <>
                {/* Term Header Card */}
                <div className="bg-[#1f2533] border-2 border-[#333d52] p-3 rounded-sm shadow-md space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-sm bg-cyan-950 text-cyan-300 font-mono font-black text-xs border border-cyan-500/50 shadow-sm">
                        {activeTerm.abbreviation || activeTerm.term}
                      </span>
                      <h2 className="text-base font-black text-white tracking-tight">
                        {activeTerm.term}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-sm bg-[#12151e] text-gray-300 border border-gray-700">
                        {activeTerm.categoryLabel}
                      </span>
                      {activeTerm.units && (
                        <span className="px-2 py-0.5 rounded-sm bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                          Unidade: {activeTerm.units}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-200 text-xs font-medium leading-relaxed bg-[#141822] p-2.5 rounded-sm border border-[#2b3346]">
                    {activeTerm.shortDefinition}
                  </p>
                </div>

                {/* Mathematical Formula Banner (if present) */}
                {activeTerm.formula && (
                  <div className="bg-[#121824] border border-cyan-500/40 p-2.5 rounded-sm flex items-center justify-between gap-2 font-mono shadow-inner">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <span className="material-symbols-outlined text-sm">functions</span>
                      <span>Relação Física / Matemática:</span>
                    </div>
                    <div className="px-3 py-1 bg-black/80 rounded border border-cyan-500/60 text-amber-300 font-black text-xs">
                      {activeTerm.formula}
                    </div>
                  </div>
                )}

                {/* Detailed Physical & Technical Explanation */}
                <div className="bg-[#1c212d] border border-[#2e3748] p-3 rounded-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-[11px]">
                    <span className="material-symbols-outlined text-xs">science</span>
                    <span>FUNDAMENTAÇÃO FÍSICA E COMPUTACIONAL</span>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {activeTerm.detailedExplanation}
                  </p>
                </div>

                {/* Two-Column Clinical Impact & Practical Tip Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                  {/* Card 1: Clinical Impact */}
                  <div className="bg-[#181d28] border border-emerald-500/40 p-2.5 rounded-sm space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                      <span className="material-symbols-outlined text-xs">medical_information</span>
                      <span>IMPACTO CLÍNICO & DIAGNÓSTICO</span>
                    </div>
                    <p className="text-gray-300 leading-normal font-sans text-[11px]">
                      {activeTerm.clinicalImpact}
                    </p>
                  </div>

                  {/* Card 2: Practical Operator Tip */}
                  <div className="bg-[#181d28] border border-amber-500/40 p-2.5 rounded-sm space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <span className="material-symbols-outlined text-xs">lightbulb</span>
                      <span>DICA PRÁTICA NO CONSOLE</span>
                    </div>
                    <p className="text-gray-300 leading-normal font-sans text-[11px]">
                      {activeTerm.practicalTip}
                    </p>
                  </div>
                </div>

                {/* Canon Equivalent Specification Card */}
                {activeTerm.canonEquivalent && (
                  <div className="bg-[#141822] border border-[#3e485e] p-2.5 rounded-sm flex items-center justify-between gap-2 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="font-bold text-red-500 font-sans">CANON</span>
                      <span>Linha Aquilion / Vitrea:</span>
                    </div>
                    <span className="text-cyan-300 font-bold">
                      {activeTerm.canonEquivalent}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ===================== MODAL FOOTER ===================== */}
        <footer className="h-9 bg-gradient-to-r from-[#1c212d] via-[#242b3b] to-[#1c212d] border-t-2 border-[#12151e] px-4 flex items-center justify-between shrink-0 font-mono text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">● ALARA & EURATOM Guidelines</span>
            <span>•</span>
            <span>ICRP Publication 103 / 135</span>
          </div>
          <div>
            Pressione <kbd className="px-1.5 py-0.5 bg-black/60 rounded border border-gray-600 text-gray-200">ESC</kbd> para fechar
          </div>
        </footer>

      </div>
    </div>
  );
};
