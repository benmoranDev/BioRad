import React, { useState } from 'react';
import { TaskPendency, ThemeMode } from '../../types';

interface SubmissionModalProps {
  task: TaskPendency | null;
  onClose: () => void;
  onSubmitSuccess: (taskId: string, fileName: string) => void;
  theme?: ThemeMode;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  task,
  onClose,
  onSubmitSuccess,
  theme = 'dark'
}) => {
  const [fileName, setFileName] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!task) return null;

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSubmitting(false);
          onSubmitSuccess(task.id, fileName || `Trabalho_${task.type}_${Date.now()}.pdf`);
          onClose();
        }, 300);
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        className={`max-w-md w-full p-6 sm:p-7 rounded-[36px] border shadow-2xl space-y-4 transition-all ${
          isDark
            ? 'bg-[#1c1f29] border-[#4cd7f6]/40 text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-800 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/20">
          <div>
            <span className="text-[10px] font-mono text-cyan-500 uppercase font-bold tracking-wider">
              Submissão de Trabalho
            </span>
            <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div
            className={`p-4 rounded-[22px] border space-y-1 ${
              isDark ? 'bg-[#0a0e17]/80 border-white/5 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>Disciplina: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{task.courseTitle}</strong></div>
            <div>Prazo Final: <strong className="text-amber-500">{task.deadlineDate}</strong></div>
            <div>Formato Requerido: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{task.format}</strong></div>
          </div>

          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Anexar Arquivo do Trabalho Acadêmico
            </label>
            <div
              className={`border-2 border-dashed rounded-[28px] p-6 text-center cursor-pointer transition-colors ${
                isDark
                  ? 'border-[#3d494c] hover:border-[#4cd7f6] bg-[#0a0e17]/50'
                  : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-cyan-500 text-3xl mb-1">upload_file</span>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Arraste seu arquivo ou clique para selecionar
              </p>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Suporta arquivos PDF, Documentos, Imagens ou ZIP até 50MB
              </p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setFileName(e.target.files[0].name);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 rounded-full bg-cyan-500/15 text-cyan-600 font-semibold text-[11px] cursor-pointer hover:bg-cyan-500/25 transition-colors"
              >
                Selecionar do Computador
              </label>
            </div>
            {fileName && (
              <div className="mt-2 text-emerald-500 font-mono flex items-center gap-1.5 text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Arquivo selecionado: {fileName}
              </div>
            )}
          </div>

          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Observações para o Professor / Tutor (Opcional)
            </label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              placeholder="Ex: Trabalho individual com análise dos parâmetros técnicos e discussão anatômica."
              className={`w-full p-3.5 rounded-[20px] border outline-none font-medium ${
                isDark
                  ? 'bg-[#0a0e17] border-white/10 text-white focus:border-[#4cd7f6]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
              }`}
            />
          </div>

          {isSubmitting && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-cyan-500 font-medium font-mono">
                <span>Protocolando entrega no portal do aluno...</span>
                <span>{progress}%</span>
              </div>
              <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#262a34]' : 'bg-slate-200'}`}>
                <div className="bg-cyan-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#090d16] font-bold shadow-lg shadow-[#06b6d4]/30 hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>Protocolar Envio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
