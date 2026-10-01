import React, { useState } from 'react';
import { ThemeMode } from '../../types';

interface LabSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSuccessToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const LabSupportModal: React.FC<LabSupportModalProps> = ({
  isOpen,
  onClose,
  onShowSuccessToast,
  theme = 'dark'
}) => {
  const [topic, setTopic] = useState('reconstrucao_3d');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      onShowSuccessToast('Dúvida enviada com sucesso para a monitoria! Um professor ou tutor responderá em instantes.');
      onClose();
      setSent(false);
      setMessage('');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className={`max-w-md w-full p-6 sm:p-7 rounded-[36px] border shadow-2xl space-y-4 transition-all ${
          isDark
            ? 'bg-[#1c1f29] border-[#4edea3]/40 text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-800 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/20">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDark
                  ? 'bg-[#00a572]/20 border border-[#4edea3]/40 text-[#4edea3]'
                  : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <div>
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">
                Plantão de Monitoria de Radiologia
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#4edea3]' : 'text-emerald-700 font-semibold'}`}>
                Professores e Monitores Online para Alunos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Assunto da Dúvida
            </label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-full border outline-none font-medium ${
                isDark
                  ? 'bg-[#0a0e17] border-white/10 text-white focus:border-[#4edea3]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
              }`}
            >
              <option value="reconstrucao_3d">Reconstrução MPR / VR 3D e Anatomia Seccional</option>
              <option value="posicionamento">Posicionamento Radiológico e Parâmetros Técnicos (kV / mAs)</option>
              <option value="contraste">Protocolo de Contraste Iodado e Janelas HU</option>
              <option value="dosimetria">Cálculo de Dose, DLP e Proteção Radiológica (RDC 330)</option>
              <option value="exercicios">Resolução de Exercícios e Casos Clínicos</option>
            </select>
          </div>

          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Descreva sua Dúvida
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Digite sua dúvida sobre a matéria, caso prático ou interpretação das imagens..."
              required
              className={`w-full p-3.5 rounded-[20px] border outline-none font-medium ${
                isDark
                  ? 'bg-[#0a0e17] border-white/10 text-white focus:border-[#4edea3]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          <div
            className={`p-3.5 rounded-full border text-[11px] flex items-center gap-2 ${
              isDark
                ? 'bg-[#0a0e17]/80 border-white/5 text-gray-400'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="material-symbols-outlined text-emerald-500 text-sm">schedule</span>
            <span>Tempo médio de resposta da monitoria: <strong>menos de 10 minutos</strong></span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-full font-medium cursor-pointer ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sent}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-[#00a572] to-[#4edea3] text-[#090d16] font-bold shadow-md shadow-[#00a572]/30 flex items-center gap-1.5 cursor-pointer hover:opacity-95"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>{sent ? 'Enviando...' : 'Enviar Dúvida'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
