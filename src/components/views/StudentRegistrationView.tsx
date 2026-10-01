import React, { useState } from 'react';
import { User, ThemeMode } from '../../types';
import { storageService } from '../../services/storage';
import { supabaseService } from '../../services/supabaseClient';
import { formatCpf, isValidCpf } from '../../utils/cpfValidator';

interface StudentRegistrationViewProps {
  theme?: ThemeMode;
  onShowSuccessToast: (msg: string) => void;
}

export const StudentRegistrationView: React.FC<StudentRegistrationViewProps> = ({
  theme = 'dark',
  onShowSuccessToast
}) => {
  const isDark = theme === 'dark';
  const [students, setStudents] = useState<User[]>(() => storageService.getStudents());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [viewingProof, setViewingProof] = useState<User | null>(null);
  const [isSyncingAuth, setIsSyncingAuth] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseName, setCourseName] = useState('Tomografia Computadorizada Clínica & Activion 16');
  const [shift, setShift] = useState('EAD 100% Online Flexível');
  const [enrollmentId, setEnrollmentId] = useState(`2026-RAD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'regular' | 'warning' | 'honor' | 'expired'>('regular');
  const [formError, setFormError] = useState<string | null>(null);

  const refreshList = () => {
    setStudents(storageService.getStudents());
  };

  const openNewStudentModal = () => {
    setEditingStudent(null);
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setCourseName('Tomografia Computadorizada Clínica & Activion 16');
    setShift('EAD 100% Online Flexível');
    setEnrollmentId(`2026-RAD-${Math.floor(1000 + Math.random() * 9000)}`);
    setPassword('');
    setStatus('regular');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditStudentModal = (student: User) => {
    setEditingStudent(student);
    setName(student.name);
    setCpf(student.cpf || '');
    setEmail(student.email);
    setPhone(student.phone || '');
    setCourseName(student.courseName || student.specialty || 'Tomografia Computadorizada Clínica');
    setShift(student.shift || 'EAD 100% Online Flexível');
    setEnrollmentId(student.enrollmentId);
    setPassword(student.password || '');
    setStatus(student.status || 'regular');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    if (!cpf.trim()) {
      setFormError('O CPF é obrigatório para emissão e fé pública do Certificado Oficial.');
      return;
    }

    if (!isValidCpf(cpf)) {
      setFormError('O CPF informado é inválido. Digite os 11 dígitos corretos para registro acadêmico.');
      return;
    }

    const formattedCpf = formatCpf(cpf.trim());

    if (editingStudent) {
      const updated: User = {
        ...editingStudent,
        name: name.trim(),
        email: email.trim(),
        cpf: formattedCpf,
        phone: phone.trim(),
        specialty: courseName,
        courseName,
        shift,
        enrollmentId,
        password: password || editingStudent.password || '123',
        status
      };
      const res = storageService.updateUser(updated);
      if (res.success) {
        onShowSuccessToast(`Cadastro de ${name} atualizado com sucesso!`);
        setIsModalOpen(false);
        refreshList();
      } else {
        setFormError(res.message);
      }
    } else {
      const newStudent: User = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: 'student',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=250&q=80`,
        enrollmentId: enrollmentId.trim() || `2026-RAD-${Math.floor(1000 + Math.random() * 9000)}`,
        specialty: courseName,
        courseName,
        shift,
        cpf: formattedCpf,
        phone: phone.trim(),
        gpa: 4.0,
        completedHours: 0,
        totalRequiredHours: 180,
        attendanceRate: 100,
        status,
        password: password.trim() || '123',
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      // Cadastra no Supabase Auth em segundo plano
      supabaseService.signUpWithSupabase(newStudent.email, newStudent.password || '123456', newStudent).catch(() => {});

      const res = storageService.registerUser(newStudent);
      if (res.success) {
        onShowSuccessToast(`Aluno ${name} matriculado e sincronizado com o Supabase! Matrícula: ${newStudent.enrollmentId}`);
        setIsModalOpen(false);
        refreshList();
      } else {
        setFormError(res.message);
      }
    }
  };

  const handleSyncAuthUsers = async () => {
    setIsSyncingAuth(true);
    try {
      const res = await supabaseService.syncUsersToSupabaseAuth();
      setIsSyncingAuth(false);
      onShowSuccessToast(res.message);
    } catch (err: any) {
      setIsSyncingAuth(false);
      alert('Erro ao sincronizar usuários com Supabase Auth: ' + (err?.message || String(err)));
    }
  };

  const handleDeleteStudent = (student: User) => {
    if (window.confirm(`Deseja realmente remover o aluno "${student.name}" (${student.enrollmentId}) do sistema acadêmico?`)) {
      const res = storageService.deleteUser(student.id);
      if (res.success) {
        onShowSuccessToast(`Aluno ${student.name} removido com sucesso.`);
        refreshList();
      } else {
        alert(res.message);
      }
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cpf && s.cpf.includes(searchTerm));

    const matchesCourse =
      filterCourse === 'all' ||
      (s.courseName && s.courseName.toLowerCase().includes(filterCourse.toLowerCase())) ||
      (s.specialty && s.specialty.toLowerCase().includes(filterCourse.toLowerCase()));

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-7">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-500 font-mono mb-1">
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            <span>Secretaria Acadêmica &amp; Controle de Matrículas</span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Cadastro de Alunos
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Registro de novos discentes, emissão de matrículas oficiais e gestão de alunos matriculados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAuthUsers}
            disabled={isSyncingAuth}
            className="px-4 py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Cria ou atualiza todos os usuários no painel Authentication -> Users do Supabase"
          >
            <span className={`material-symbols-outlined text-base ${isSyncingAuth ? 'animate-spin' : ''}`}>
              {isSyncingAuth ? 'sync' : 'cloud_sync'}
            </span>
            <span>{isSyncingAuth ? 'Sincronizando Auth...' : 'Sincronizar Supabase Auth'}</span>
          </button>

          <button
            onClick={openNewStudentModal}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#4edea3] text-[#090d16] font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Cadastrar Novo Aluno</span>
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-[28px] border ${
            isDark ? 'bg-[#141f38]/60 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total de Alunos</span>
            <span className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">groups</span>
            </span>
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">{students.length}</p>
          <p className="text-[10px] text-emerald-400 font-medium mt-1">✓ Registrados no sistema</p>
        </div>

        <div
          className={`p-5 rounded-[28px] border ${
            isDark ? 'bg-[#141f38]/60 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Alunos Regulares</span>
            <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </span>
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">
            {students.filter(s => s.status === 'regular' || s.status === 'honor').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Situação regular ativa</p>
        </div>

        <div
          className={`p-5 rounded-[28px] border ${
            isDark ? 'bg-[#141f38]/60 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tomografia Computadorizada</span>
            <span className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">biotech</span>
            </span>
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">
            {students.filter(s => (s.specialty || '').toLowerCase().includes('tomografia') || (s.courseName || '').toLowerCase().includes('tomografia')).length}
          </p>
          <p className="text-[10px] text-indigo-400 mt-1">Especialização TC &amp; Radio</p>
        </div>

        <div
          className={`p-5 rounded-[28px] border ${
            isDark ? 'bg-[#141f38]/60 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Sincronização Cloud</span>
            <span className="w-8 h-8 rounded-full bg-[#3ecf8e]/10 text-[#4edea3] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">cloud_sync</span>
            </span>
          </div>
          <p className="text-sm font-bold mt-2 text-[#4edea3] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            Supabase Ativo
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Tabela radbio_users</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 sm:p-5 rounded-full border flex flex-col md:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-[#141f38]/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="relative w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, matrícula, e-mail ou CPF..."
            className={`w-full pl-10 pr-4 py-2 rounded-full text-xs outline-none border transition-all ${
              isDark
                ? 'bg-[#0a0e17]/80 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className={`px-4 py-2 rounded-full text-xs outline-none border cursor-pointer ${
              isDark
                ? 'bg-[#0a0e17]/80 border-white/10 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todos os Cursos</option>
            <option value="tomografia">Tomografia Computadorizada</option>
            <option value="radiologia">Tecnologia em Radiologia</option>
            <option value="ressonancia">Ressonância Magnética</option>
            <option value="40h">Cursos Livres 40h</option>
          </select>

          <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div
        className={`rounded-[32px] border overflow-hidden ${
          isDark ? 'bg-[#141f38]/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                  isDark ? 'bg-[#0e1626]/80 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">Matrícula &amp; CPF</th>
                <th className="py-3 px-4">Curso / Especialidade</th>
                <th className="py-3 px-4">Turno</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr
                    key={student.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-9 h-9 rounded-full object-cover border border-cyan-500/30"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';
                          }}
                        />
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                          {student.phone && <p className="text-[10px] text-cyan-500/80 font-mono">{student.phone}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-cyan-400 block">{student.enrollmentId}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {student.cpf ? `CPF: ${student.cpf}` : 'CPF Não Informado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {student.courseName || student.specialty}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Cadastrado em: {student.createdAt || 'Semestre 2026.1'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">
                        {student.shift || 'EAD 100% Online'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.status === 'honor'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : student.status === 'warning'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {student.status === 'honor' ? 'Láurea' : student.status === 'warning' ? 'Pendente' : 'Regular'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingProof(student)}
                          title="Emitir Comprovante de Matrícula"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'border-white/10 hover:border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/10'
                              : 'border-slate-200 hover:border-cyan-500 text-cyan-700 hover:bg-cyan-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">print</span>
                        </button>

                        <button
                          onClick={() => openEditStudentModal(student)}
                          title="Editar Cadastro"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'border-white/10 hover:border-white/30 text-slate-300 hover:text-white hover:bg-white/5'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(student)}
                          title="Remover Aluno"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'border-white/10 hover:border-rose-400/40 text-rose-400 hover:bg-rose-500/10'
                              : 'border-slate-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">person_off</span>
                    <p className="font-semibold">Nenhum aluno encontrado para os critérios selecionados.</p>
                    <p className="text-[11px] mt-1">Clique em "Cadastrar Novo Aluno" para realizar a matrícula.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro / Edição de Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all my-8 ${
              isDark ? 'bg-[#141f38] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center">
                  <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-[#141f38]' : 'bg-white'}`}>
                    <span className="material-symbols-outlined text-cyan-400 text-xl">
                      {editingStudent ? 'edit_note' : 'person_add'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {editingStudent ? 'Editar Cadastro do Aluno' : 'Cadastrar Novo Aluno'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStudent ? 'Atualize as informações acadêmicas do discente' : 'Preencha os dados oficiais de matrícula'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: João da Silva Gomes"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between mb-1 font-semibold text-slate-300">
                    <span>CPF (Obrigatório) *</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Para o Certificado</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Obrigatório para autenticidade na impressão do certificado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    E-mail Institucional ou Pessoal *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="aluno@radbio.edu.br"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Curso de Ingresso
                  </label>
                  <select
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  >
                    <option value="Tomografia Computadorizada Clínica & Activion 16">Tomografia Computadorizada Clínica &amp; Activion 16 (40h)</option>
                    <option value="Tecnólogo em Radiologia & Diagnóstico por Imagem">Tecnólogo em Radiologia &amp; Diagnóstico por Imagem</option>
                    <option value="Ressonância Magnética & Física de Spin">Ressonância Magnética &amp; Física de Spin</option>
                    <option value="Radioproteção & Dosimetria Hospitalar">Radioproteção &amp; Dosimetria Hospitalar</option>
                    <option value="Exames Contrastados em TC">Exames Contrastados em TC</option>
                    <option value="Tomografia no Centro Cirúrgico & Politrauma">Tomografia no Centro Cirúrgico &amp; Politrauma</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Turno / Modalidade
                  </label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  >
                    <option value="EAD 100% Online Flexível">EAD 100% Online Flexível</option>
                    <option value="Noturno Semipresencial">Noturno Semipresencial</option>
                    <option value="Matutino Presencial">Matutino Presencial</option>
                    <option value="Sábados Intensivo">Sábados Intensivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Número de Matrícula
                  </label>
                  <input
                    type="text"
                    value={enrollmentId}
                    onChange={e => setEnrollmentId(e.target.value)}
                    placeholder="2026-RAD-XXXX"
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-cyan-400 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-cyan-700 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Senha de Acesso Inicial
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Definir senha (padrão: 123)"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17]/80 border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    Status da Matrícula
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    }`}
                  >
                    <option value="regular">Regular (Ativo)</option>
                    <option value="honor">Destaque / Láurea</option>
                    <option value="warning">Pendente / Documentos</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold shadow-lg transition-all cursor-pointer hover:opacity-95"
                >
                  {editingStudent ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comprovante de Matrícula Oficial */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl relative my-8 ${
              isDark ? 'bg-[#0f172a] border-cyan-500/30 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <button
              onClick={() => setViewingProof(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="border-b border-white/10 pb-4 mb-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center mb-2">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <span className="material-symbols-outlined text-cyan-400 text-2xl">biotech</span>
                </div>
              </div>
              <h3 className="text-base font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
                RadBio Acadêmico • Ensino em Radiologia &amp; TC
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono uppercase tracking-wider">
                Comprovante Oficial de Matrícula
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[10px] text-cyan-300 uppercase tracking-wider block font-semibold">Aluno(a) Matriculado(a)</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingProof.name}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Matrícula: {viewingProof.enrollmentId} • {viewingProof.cpf ? `CPF: ${viewingProof.cpf}` : 'CPF Registrado'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Curso:</span>
                  <span className="font-semibold text-slate-200">{viewingProof.courseName || viewingProof.specialty}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Turno / Modalidade:</span>
                  <span className="font-semibold text-slate-200">{viewingProof.shift || 'EAD 100% Online'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">E-mail Acadêmico:</span>
                  <span className="font-semibold text-slate-200 truncate block">{viewingProof.email}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Situação Acadêmica:</span>
                  <span className="font-semibold text-emerald-400 uppercase">Regular &amp; Ativo</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 text-[10px] text-slate-400 border border-white/5 leading-relaxed">
                Este comprovante atesta vínculo acadêmico com a plataforma RadBio Cursos para o semestre letivo 2026.1, em conformidade com as diretrizes educacionais em Tomografia Computadorizada e Diagnóstico por Imagem.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Autenticação: RADBIO-MTR-2026</span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-cyan-400"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Imprimir Comprovante</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
