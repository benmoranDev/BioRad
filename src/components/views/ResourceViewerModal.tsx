import React from 'react';
import { LessonResource, ThemeMode } from '../../types';

interface ResourceViewerModalProps {
  resource: LessonResource | null;
  onClose: () => void;
  isOpen?: boolean;
  theme?: ThemeMode;
}

export const ResourceViewerModal: React.FC<ResourceViewerModalProps> = ({
  resource,
  onClose,
  theme = 'dark'
}) => {
  if (!resource) return null;
  const isDark = theme === 'dark';

  const handleDownload = () => {
    if (resource.url && resource.url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const content = `Biorad Cursos - Instituto de Radiologia & Tomografia Computadorizada
DOCUMENTO ACADÊMICO OFICIAL
------------------------------------------------------------
Título: ${resource.title}
Tipo: ${resource.type.toUpperCase()}
Data de Inclusão: ${resource.dateAdded}
Autor: ${resource.authorName || 'Corpo Docente Biorad Cursos'}
------------------------------------------------------------
DESCRIÇÃO:
${resource.description}

CONTEÚDO DO MATERIAL DIDÁTICO:
${resource.previewContent || 'Consulte o material anexo no portal do aluno ou entre em contato com o professor da disciplina para esclarecimentos adicionais.'}

------------------------------------------------------------
Autenticação Digital: BIORAD-DOC-${Date.now()}-TC
Uso exclusivo para fins de ensino e aprendizagem acadêmica.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`max-w-3xl w-full rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
        isDark ? 'bg-[#181b25] border-cyan-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-white/10 bg-[#141f38]/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">
                {resource.type === 'pdf' ? 'picture_as_pdf' : resource.type === 'protocol' ? 'assignment' : 'biotech'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 font-bold">
                  Material Didático Exclusivo • Biorad Cursos
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {resource.type.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] truncate max-w-md">
                {resource.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Baixar Arquivo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Resumo &amp; Metadados:
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {resource.description}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono pt-1">
              <span>Tamanho: {resource.fileSize || '3.2 MB'}</span>
              <span>•</span>
              <span>Incluso em: {resource.dateAdded}</span>
              <span>•</span>
              <span>Docente: {resource.authorName || 'Prof. Dr. Marcus Vinicius'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border font-mono text-xs leading-relaxed whitespace-pre-wrap ${
            isDark ? 'bg-[#0a0e17] border-white/10 text-emerald-300/90' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            {resource.previewContent || `CONTEÚDO DO MATERIAL DIDÁTICO OFICIAL\n==================================\n\nEste arquivo contém os parâmetros e protocolos clínicos recomendados para o curso.\nPara dúvidas sobre o material, utilize a aba "Dúvidas & Chat" da sala de aula.`}
          </div>

          {resource.url && (
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-mono truncate max-w-sm">
                Link de Acesso Externo: {resource.url}
              </span>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 hover:bg-cyan-400"
              >
                <span>Abrir Link</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
