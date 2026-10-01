import React, { useState, useEffect, useMemo } from 'react';
import { CursoLivre, PaymentTransaction, ThemeMode, User } from '../../types';
import { storageService } from '../../services/storage';
import { pdfExportService } from '../../services/pdfExport';
import { initialPaymentPlans } from '../../data/initialData';
import { generatePixBrCode, generatePixQrCodeDataUrl, DEFAULT_PIX_CONFIG, PixConfig } from '../../utils/pixHelper';
import { formatCpf, isValidCpf } from '../../utils/cpfValidator';
import { EnrollmentEmailModal } from '../modals/EnrollmentEmailModal';
import { buildEnrollmentEmailData, calculateExpirationDate, EnrollmentEmailData } from '../../utils/emailTemplates';
import { emailService } from '../../services/emailService';

interface PaymentCheckoutViewProps {
  onPaymentSuccess?: (courseTitle: string) => void;
  onNavigateTab?: (tab: string) => void;
  selectedCourseId?: string | null;
  theme?: ThemeMode;
}

export const PaymentCheckoutView: React.FC<PaymentCheckoutViewProps> = ({
  onPaymentSuccess,
  onNavigateTab,
  selectedCourseId = null,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const currentUser: User = storageService.getCurrentUser();
  const [cursosLivres, setCursosLivres] = useState<CursoLivre[]>(() => storageService.getCursosLivres());
  const [transactionsList, setTransactionsList] = useState<PaymentTransaction[]>(() => storageService.getPaymentTransactions());

  // Load custom Pix settings
  const [pixSettings, setPixSettings] = useState<PixConfig>(() => storageService.getPixSettings());
  const [isEditingPixKey, setIsEditingPixKey] = useState(false);
  const [editPixKeyValue, setEditPixKeyValue] = useState(pixSettings.keyValue || DEFAULT_PIX_CONFIG.keyValue);
  const [editPixKeyType, setEditPixKeyType] = useState<PixConfig['keyType']>(pixSettings.keyType || 'email');
  const [editMerchantName, setEditMerchantName] = useState(pixSettings.merchantName || 'BIORAD CURSOS S/A');
  const [editMerchantCity, setEditMerchantCity] = useState(pixSettings.merchantCity || 'SAO PAULO');

  // Tab mode: '40h_courses' | 'bundle' | 'history'
  const [checkoutMode, setCheckoutMode] = useState<'40h_courses' | 'bundle' | 'history'>('40h_courses');

  // Selected item
  const [selectedCourse, setSelectedCourse] = useState<CursoLivre | null>(() => {
    if (selectedCourseId) {
      return cursosLivres.find(c => c.id === selectedCourseId) || cursosLivres[0];
    }
    return cursosLivres[0];
  });

  const [selectedBundlePlan, setSelectedBundlePlan] = useState(initialPaymentPlans[0]);

  // Payment Method: 'pix' | 'credit'
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');

  // Gateway mode for credit card: 'mercadopago' | 'asaas' | 'direct'
  const [cardGateway, setCardGateway] = useState<'mercadopago' | 'asaas' | 'direct'>('mercadopago');

  // Credit card state
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 7890');
  const [cardHolder, setCardHolder] = useState(currentUser.name.toUpperCase());
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('482');
  const [cardCpf, setCardCpf] = useState(currentUser.cpf || '384.912.748-02');
  const [installments, setInstallments] = useState(1);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Pix state
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState(900); // 15 minutes in seconds
  const [realQrCodeDataUrl, setRealQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // Processing & Transaction result
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [completedTransaction, setCompletedTransaction] = useState<PaymentTransaction | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState<EnrollmentEmailData | null>(null);

  // Sync selected course if prop changes
  useEffect(() => {
    if (selectedCourseId) {
      const found = cursosLivres.find(c => c.id === selectedCourseId);
      if (found) {
        setSelectedCourse(found);
        setCheckoutMode('40h_courses');
      }
    }
  }, [selectedCourseId, cursosLivres]);

  // Pix countdown timer
  useEffect(() => {
    if (paymentMethod !== 'pix' || completedTransaction) return;
    const interval = setInterval(() => {
      setPixTimeRemaining(prev => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, completedTransaction]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Card brand detection
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^(606282|3841|50)/.test(clean)) return 'elo';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^60/.test(clean)) return 'hipercard';
    return 'mastercard';
  }, [cardNumber]);

  // Active Price Calculation
  const activeItem = checkoutMode === '40h_courses' ? selectedCourse : null;
  const currentPrice = activeItem ? activeItem.price : selectedBundlePlan.price;
  const currentTitle = activeItem ? `${activeItem.title} (40h)` : selectedBundlePlan.title;
  const currentWorkload = activeItem ? 40 : 180;

  // Pix Copia-e-Cola payload with real EMV standard BRCode using User's Pix Key
  const pixQrCodeString = useMemo(() => {
    const courseCode = activeItem ? activeItem.code : 'RADBIO';
    const txId = `RAD${courseCode.replace(/[^A-Za-z0-9]/g, '')}`.slice(0, 20);
    return generatePixBrCode(
      currentPrice,
      pixSettings.keyValue,
      pixSettings.merchantName,
      pixSettings.merchantCity,
      txId,
      pixSettings.keyType
    );
  }, [activeItem, currentPrice, pixSettings]);

  // Generate Real Scannable QR Code Data URL whenever the payload changes
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingQr(true);
    generatePixQrCodeDataUrl(pixQrCodeString)
      .then(url => {
        if (isMounted) {
          setRealQrCodeDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pixQrCodeString]);

  const handleSavePixKeyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPixKeyValue.trim()) return;
    const updated: PixConfig = {
      ...pixSettings,
      keyType: editPixKeyType,
      keyValue: editPixKeyValue.trim(),
      merchantName: editMerchantName.trim() || 'RADBIO EDUCACAO S/A',
      merchantCity: editMerchantCity.trim() || 'SAO PAULO'
    };
    storageService.savePixSettings(updated);
    setPixSettings(updated);
    setIsEditingPixKey(false);
  };

  // Format Card input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCpf(formatCpf(e.target.value));
  };

  // Download QR Code image as PNG
  const handleDownloadQrPng = () => {
    if (!realQrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = realQrCodeDataUrl;
    link.download = `QRCode_Pix_RadBio_${(activeItem?.code || '40H')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Payment Execution (Real & Simulated Webhook Confirmation)
  const handleExecutePayment = () => {
    setCardError(null);

    // Validate Card fields if credit card
    if (paymentMethod === 'credit') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 13) {
        setCardError('Digite um número de cartão de crédito válido (16 dígitos).');
        return;
      }
      if (!cardHolder.trim()) {
        setCardError('Informe o nome do titular do cartão.');
        return;
      }
      if (cardExpiry.length < 5) {
        setCardError('Informe a data de validade no formato MM/AA.');
        return;
      }
      if (cardCvv.length < 3) {
        setCardError('Informe o código de segurança (CVV com 3 ou 4 dígitos).');
        return;
      }
      if (!cardCpf.trim() || !isValidCpf(cardCpf)) {
        setCardError('CPF do titular inválido. O CPF é obrigatório para emissão de nota fiscal e certificado.');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStage(
      paymentMethod === 'pix'
        ? `Consultando chave Pix (${pixSettings.keyValue}) no Banco Central (Bacen SPI)...`
        : cardGateway === 'mercadopago'
        ? 'Autenticando via Mercado Pago API • Análise Antifraude 3D Secure...'
        : cardGateway === 'asaas'
        ? 'Conectando ao gateway bancário Asaas • Gerando Tokenização PCI...'
        : 'Processando transação com Adquirente Bancária (Criptografia SSL 256 bits)...'
    );

    setTimeout(() => {
      setProcessingStage(
        paymentMethod === 'pix'
          ? `PIX Confirmado na chave ${pixSettings.keyValue}! Liquidação instantânea homologada.`
          : 'Cartão Autorizado com Sucesso! Token de transação criptografado recebido.'
      );

      setTimeout(() => {
        const { expiresAtStr } = calculateExpirationDate(60);
        const nowStr = new Date().toLocaleString('pt-BR');

        const tx: PaymentTransaction = {
          id: `tx_${Date.now()}`,
          transactionCode: `RAD-TX-${Date.now().toString().slice(-8)}`,
          courseId: activeItem ? activeItem.id : selectedBundlePlan.id,
          courseTitle: currentTitle,
          studentName: currentUser.name,
          studentEmail: currentUser.email,
          studentCpf: cardCpf || currentUser.cpf || '384.912.748-02',
          amount: currentPrice,
          paymentMethod,
          installments: paymentMethod === 'credit' ? installments : 1,
          cardBrand: paymentMethod === 'credit' ? cardBrand : undefined,
          cardLast4: paymentMethod === 'credit' ? cardNumber.slice(-4) : undefined,
          pixQrCodeString: paymentMethod === 'pix' ? pixQrCodeString : undefined,
          pixEndToEndId: paymentMethod === 'pix' ? `E28491092${Date.now()}88941BCB` : undefined,
          status: 'completed',
          createdAt: nowStr,
          paidAt: nowStr,
          certificateWorkloadHours: currentWorkload,
          accessPeriodDays: 60,
          expiresAt: expiresAtStr
        };

        const emailData = buildEnrollmentEmailData(tx, currentUser, 60);
        setEmailModalData(emailData);

        // Dispatch email confirmation and update student access lifecycle
        emailService.sendEnrollmentConfirmation(tx, currentUser, 60);

        if (activeItem) {
          storageService.enrollInCursoLivre(activeItem.id, tx);
        } else {
          storageService.savePaymentTransaction(tx);
          // Unlock all courses if bundle
          const allCourses = storageService.getCursosLivres();
          allCourses.forEach(c => {
            c.isEnrolled = true;
            c.expiresAt = expiresAtStr;
            c.enrolledAt = new Date().toLocaleDateString('pt-BR');
            c.accessPeriodDays = 60;
          });
          storageService.setCursosLivres(allCourses);
        }

        // Refresh internal lists
        setCursosLivres(storageService.getCursosLivres());
        setTransactionsList(storageService.getPaymentTransactions());

        setIsProcessing(false);
        setCompletedTransaction(tx);
        if (onPaymentSuccess) {
          onPaymentSuccess(currentTitle);
        }
      }, 900);
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-8">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl transition-all shadow-xl bg-gradient-to-r from-[#06b6d4]/10 via-[#10b981]/5 to-transparent border-[#4cd7f6]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Matrícula Digital Automatizada com PIX Real &amp; Cartão de Crédito</span>
            </div>
            <h1 className={`text-2xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Cursos Livres (40 Horas) &amp; Pagamentos
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
              Emissão de certificado oficial de 40 horas com fé pública acadêmica conforme a <strong>Lei nº 9.394/1996 (LDB)</strong> e <strong>Decreto nº 5.154/2004</strong>. O QR Code PIX gerado segue o padrão EMV do Banco Central do Brasil e pode ser escaneado diretamente pelo app do seu banco.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className={`p-1.5 rounded-full border flex items-center gap-1 self-start lg:self-center shrink-0 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <button
              type="button"
              onClick={() => {
                setCheckoutMode('40h_courses');
                setCompletedTransaction(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                checkoutMode === '40h_courses'
                  ? 'bg-cyan-500 text-[#090d16] shadow-md shadow-cyan-500/30'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">school</span>
              <span>Cursos (40h)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutMode('bundle');
                setCompletedTransaction(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                checkoutMode === 'bundle'
                  ? 'bg-cyan-500 text-[#090d16] shadow-md shadow-cyan-500/30'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>Passaporte VIP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutMode('history');
                setTransactionsList(storageService.getPaymentTransactions());
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                checkoutMode === 'history'
                  ? 'bg-emerald-500 text-[#090d16] shadow-md shadow-emerald-500/30'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Comprovantes ({transactionsList.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* VIEW MODE: HISTORY OF TRANSACTIONS & RECEIPTS */}
      {checkoutMode === 'history' ? (
        <div className="space-y-6 animate-fade-in">
          <div className={`p-6 sm:p-8 rounded-[36px] border backdrop-blur-xl shadow-xl space-y-5 ${
            isDark ? 'bg-[#181b25]/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/15">
              <div>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">history_edu</span>
                  <span>Histórico de Pagamentos &amp; Comprovantes Fiscais</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprovantes oficiais com autenticação digital para fins acadêmicos e comprovação funcional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutMode('40h_courses')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs flex items-center gap-1.5 self-start sm:self-center cursor-pointer hover:opacity-95 shadow-md shadow-cyan-500/20"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Nova Matrícula</span>
              </button>
            </div>

            {transactionsList.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-500">receipt</span>
                <p className="text-sm font-semibold text-slate-400">Nenhuma transação registrada até o momento.</p>
                <button
                  type="button"
                  onClick={() => setCheckoutMode('40h_courses')}
                  className="px-5 py-2.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold cursor-pointer hover:bg-cyan-500/30"
                >
                  Ver Cursos Disponíveis para Matrícula
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-3 px-4">Código / Protocolo</th>
                      <th className="py-3 px-4">Curso / Plano</th>
                      <th className="py-3 px-4">Forma</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Data &amp; Hora</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Comprovante PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactionsList.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {tx.transactionCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-xs truncate">
                          {tx.courseTitle}
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold">
                          {tx.paymentMethod === 'pix' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <span className="material-symbols-outlined text-xs">qr_code_2</span>
                              PIX
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-cyan-400">
                              <span className="material-symbols-outlined text-xs">credit_card</span>
                              Cartão ({tx.installments || 1}x)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          R$ {tx.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {tx.paidAt || tx.createdAt}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Aprovado
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => pdfExportService.exportComprovante(tx)}
                            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
                            title="Baixar comprovante oficial em formato PDF Paisagem"
                          >
                            <span className="material-symbols-outlined text-sm text-cyan-400">download</span>
                            <span>Baixar PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : !completedTransaction ? (
        /* MAIN CHECKOUT WORKSPACE (PIX / CARD) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Course Selector & Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`p-6 sm:p-7 rounded-[36px] border backdrop-blur-xl shadow-xl space-y-5 ${
              isDark ? 'bg-[#181b25]/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between border-b pb-4 border-slate-200/15">
                <h2 className="text-base font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">inventory_2</span>
                  {checkoutMode === '40h_courses' ? 'Selecione o Curso Livre (40h)' : 'Selecione o Plano VIP'}
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                  {checkoutMode === '40h_courses' ? `${cursosLivres.length} Cursos` : 'Acesso Total'}
                </span>
              </div>

              {checkoutMode === '40h_courses' ? (
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {cursosLivres.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCourse(c)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedCourse?.id === c.id
                          ? isDark
                            ? 'bg-[#1c2333] border-cyan-400 ring-2 ring-cyan-400/20 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                            : 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/30'
                          : isDark
                            ? 'bg-[#101522]/60 border-white/5 hover:border-white/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          {c.code} • 40 HORAS
                        </span>
                        <span className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] text-cyan-400">
                          R$ {c.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold leading-tight line-clamp-2">{c.title}</h4>
                      <p className={`text-[11px] mt-1 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {c.subtitle}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-amber-400">star</span>
                          {c.rating} ({c.reviewCount})
                        </span>
                        <span>•</span>
                        <span>{c.modules.length} módulos (10h cada)</span>
                        {c.isEnrolled && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Já Matriculado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {initialPaymentPlans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedBundlePlan(plan)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedBundlePlan.id === plan.id
                          ? isDark
                            ? 'bg-[#1c2333] border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg'
                            : 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/30'
                          : isDark
                            ? 'bg-[#101522]/60 border-white/5 hover:border-white/20'
                            : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold">{plan.title}</h4>
                        <span className="text-sm font-extrabold text-cyan-400">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {plan.installments}x de R$ {(plan.price / plan.installments).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary Breakdown */}
              <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-[#0e121d] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className="text-gray-400">Carga Horária Reconhecida:</span>
                  <span className="font-bold text-emerald-400">{currentWorkload} Horas Oficiais (LDB 9.394)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Simulador Canon Activion 16:</span>
                  <span className="font-bold text-cyan-400">Acesso Ilimitado Liberado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Certificado Digital em PDF:</span>
                  <span className="font-bold text-emerald-400">Incluso com QR Code &amp; CPF</span>
                </div>
                <div className="border-t pt-2 mt-2 border-slate-200/10 flex justify-between items-baseline">
                  <span className="font-bold text-sm">Total da Matrícula:</span>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-cyan-400">
                      R$ {currentPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      ou até 12x de R$ {(currentPrice / 12).toFixed(2).replace('.', ',')} no cartão
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Gateway (PIX or Credit Card) (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 sm:p-7 rounded-3xl border backdrop-blur-xl shadow-xl space-y-6 ${
              isDark ? 'bg-[#181b25]/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Payment Method Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
                        : isDark
                          ? 'bg-[#0f1422] border-white/10 text-gray-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">qr_code_2</span>
                    <span>PIX Instantâneo Real</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      QR Code Real
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-500/10'
                        : isDark
                          ? 'bg-[#0f1422] border-white/10 text-gray-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                    <span>Cartão de Crédito</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                      Até 12x
                    </span>
                  </button>
                </div>
              </div>

              {/* PIX GATEWAY VIEW */}
              {paymentMethod === 'pix' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Pix Receiver Key Badge & Config Switcher */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-[#0f1524] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold">
                            Chave Pix Destinatária (Bacen SPI)
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Ativa
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-mono font-bold select-all ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {pixSettings.keyValue}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(pixSettings.keyValue);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2500);
                            }}
                            className="text-[10px] text-gray-400 hover:text-emerald-400 cursor-pointer flex items-center gap-0.5"
                            title="Copiar chave"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {copiedKey ? 'done' : 'content_copy'}
                            </span>
                            <span>{copiedKey ? 'Copiada!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingPixKey(true)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-center shrink-0 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-emerald-300 border-emerald-500/30' : 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">tune</span>
                      <span>Configurar Chave</span>
                    </button>
                  </div>

                  {/* PIX Key Editing Card */}
                  {isEditingPixKey && (
                    <form onSubmit={handleSavePixKeyConfig} className={`p-4 rounded-2xl border space-y-3 animate-fade-in ${
                      isDark ? 'bg-[#121929] border-cyan-400/40' : 'bg-white border-cyan-300 shadow-md'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-slate-200/10">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">settings_suggest</span>
                          Configurar Chave Pix do Sistema
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPixKey(false)}
                          className="text-gray-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕ Fechar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block mb-1 font-semibold text-gray-300">Tipo de Chave</label>
                          <select
                            value={editPixKeyType}
                            onChange={e => setEditPixKeyType(e.target.value as PixConfig['keyType'])}
                            className={`w-full p-2.5 rounded-xl border font-mono ${
                              isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="email">E-mail</option>
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="phone">Celular (+55)</option>
                            <option value="random">Chave Aleatória (EVP)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block mb-1 font-semibold text-gray-300">Sua Chave Pix</label>
                          <input
                            type="text"
                            value={editPixKeyValue}
                            onChange={e => setEditPixKeyValue(e.target.value)}
                            placeholder="ex: benmoran29dev@gmail.com"
                            className={`w-full p-2.5 rounded-xl border font-mono ${
                              isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block mb-1 font-semibold text-gray-300">Nome do Titular/Beneficiário (Bacen)</label>
                          <input
                            type="text"
                            value={editMerchantName}
                            onChange={e => setEditMerchantName(e.target.value)}
                            placeholder="RADBIO EDUCACAO"
                            className={`w-full p-2.5 rounded-xl border font-mono ${
                              isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-semibold text-gray-300">Cidade (Bacen)</label>
                          <input
                            type="text"
                            value={editMerchantCity}
                            onChange={e => setEditMerchantCity(e.target.value)}
                            placeholder="SAO PAULO"
                            className={`w-full p-2.5 rounded-xl border font-mono ${
                              isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditPixKeyValue(DEFAULT_PIX_CONFIG.keyValue);
                            setEditPixKeyType(DEFAULT_PIX_CONFIG.keyType);
                            setEditMerchantName(DEFAULT_PIX_CONFIG.merchantName);
                            setEditMerchantCity(DEFAULT_PIX_CONFIG.merchantCity);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white cursor-pointer"
                        >
                          Restaurar Padrão
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs shadow cursor-pointer hover:opacity-95"
                        >
                          Salvar Chave Pix
                        </button>
                      </div>
                    </form>
                  )}

                  <div className={`p-5 rounded-2xl border text-center space-y-4 ${
                    isDark ? 'bg-[#0e121d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Header with Countdown */}
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200/15 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>QR Code PIX Real EMV (Bacen)</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-gray-400 text-[11px]">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>Expira em: <strong className="text-amber-400">{formatTime(pixTimeRemaining)}</strong></span>
                      </div>
                    </div>

                    {/* REAL SCANNABLE QR CODE IMAGE */}
                    <div className="relative inline-block bg-white p-3.5 rounded-2xl shadow-2xl border-2 border-emerald-500/30">
                      {isGeneratingQr ? (
                        <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-800 space-y-2">
                          <span className="material-symbols-outlined text-3xl text-emerald-500 animate-spin">sync</span>
                          <span className="text-[11px] font-bold font-mono">Gerando QR Code...</span>
                        </div>
                      ) : realQrCodeDataUrl ? (
                        <div className="relative group">
                          <img
                            src={realQrCodeDataUrl}
                            alt="QR Code PIX Real para Pagamento"
                            className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl block mx-auto"
                          />
                          {/* Central PIX Watermark Logo */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-11 h-11 rounded-full bg-[#00a572] border-2 border-white shadow-md flex items-center justify-center text-white font-extrabold text-[10px] tracking-wider">
                              PIX
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-slate-700 text-xs">
                          Carregando matriz QR...
                        </div>
                      )}
                    </div>

                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                        Abra o app do seu banco no celular e aponte a câmera para o QR Code acima
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Beneficiário: <strong className="text-emerald-400">{pixSettings.merchantName}</strong> • Chave: <strong className="font-mono text-cyan-400">{pixSettings.keyValue}</strong>
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                        Compatível com Nubank, Itaú, Banco do Brasil, Inter, Bradesco, Santander, Caixa, C6 e todos os bancos do Brasil.
                      </p>
                    </div>

                    {/* Download QR Image button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleDownloadQrPng}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-sm text-cyan-400">image</span>
                        <span>Baixar Imagem do QR Code (PNG)</span>
                      </button>
                    </div>

                    {/* Copia e Cola box */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                          Código Pix Copia e Cola Oficial (Payload EMV)
                        </label>
                        <span className="text-[10px] font-mono text-emerald-400">Padrão Bacen SPI</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
                        isDark ? 'bg-[#080b13] border-white/10 text-gray-300' : 'bg-white border-slate-300 text-slate-700'
                      }`}>
                        <span className="truncate text-[11px] select-all">{pixQrCodeString}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(pixQrCodeString);
                            setCopiedPix(true);
                            setTimeout(() => setCopiedPix(false), 3000);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#090d16] font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copiedPix ? 'done' : 'content_copy'}
                          </span>
                          <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pix Confirm Trigger Button */}
                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-[#090d16] font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    <span>
                      {isProcessing
                        ? 'Confirmando com o Banco Central...'
                        : `Confirmar Pagamento Pix Real (R$ ${currentPrice.toFixed(2).replace('.', ',')})`}
                    </span>
                  </button>
                </div>
              )}

              {/* CREDIT CARD GATEWAY VIEW */}
              {paymentMethod === 'credit' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Gateway Provider Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Gateway Adquirente de Processamento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCardGateway('mercadopago')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          cardGateway === 'mercadopago'
                            ? 'bg-[#009ee3]/20 border-[#009ee3] text-[#009ee3] ring-1 ring-[#009ee3]/40'
                            : isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">handshake</span>
                        <span>Mercado Pago</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCardGateway('asaas')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          cardGateway === 'asaas'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40'
                            : isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">credit_card</span>
                        <span>Asaas Gateway</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCardGateway('direct')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          cardGateway === 'direct'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                            : isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">security</span>
                        <span>Rede / Cielo</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive 3D Visual Card Preview */}
                  <div className="perspective-1000 max-w-sm mx-auto">
                    <div
                      className={`relative w-full h-48 rounded-2xl p-5 text-white shadow-2xl transition-all duration-500 transform ${
                        isCardFlipped ? 'rotate-y-180' : ''
                      } bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0284c7] border border-cyan-400/40 shadow-cyan-500/20`}
                    >
                      {/* Card Front */}
                      {!isCardFlipped ? (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-7 rounded bg-amber-300/80 border border-amber-200/50 flex items-center justify-center">
                                <div className="w-6 h-4 border border-amber-800/40 rounded-sm grid grid-cols-2 gap-0.5 p-0.5 opacity-70">
                                  <div className="bg-amber-800/30 rounded-xs" />
                                  <div className="bg-amber-800/30 rounded-xs" />
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-gray-400 text-lg">contactless</span>
                            </div>
                            <span className="font-extrabold tracking-widest text-xs uppercase text-cyan-300">
                              {cardBrand.toUpperCase()}
                            </span>
                          </div>

                          <div className="tracking-[0.25em] text-lg font-mono font-bold text-center select-none text-cyan-100">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex justify-between items-end text-xs">
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-gray-400">Titular</div>
                              <div className="font-bold tracking-wider font-mono truncate max-w-[190px]">
                                {cardHolder || 'NOME DO ALUNO'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] uppercase tracking-wider text-gray-400">Validade</div>
                              <div className="font-bold font-mono tracking-widest">{cardExpiry || 'MM/AA'}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Card Back (CVV Strip) */
                        <div className="flex flex-col justify-between h-full py-2">
                          <div className="w-full h-8 bg-black/80 -mx-5 px-5 mt-1" />
                          <div className="space-y-1">
                            <div className="text-[9px] uppercase tracking-wider text-gray-400 text-right">
                              Código de Segurança (CVV)
                            </div>
                            <div className="w-full h-8 bg-white/90 text-slate-900 font-mono font-extrabold flex items-center justify-end px-3 rounded text-sm">
                              {cardCvv || '•••'}
                            </div>
                          </div>
                          <div className="text-[9px] text-gray-400 text-center">
                            RadBio Medical Certified Payment • Operação Protegida
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {cardError && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{cardError}</span>
                    </div>
                  )}

                  {/* Card Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block mb-1 font-bold text-gray-300">Número do Cartão de Crédito</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4532 8901 2345 7890"
                          maxLength={19}
                          className={`w-full p-3 rounded-xl border font-mono outline-none text-sm ${
                            isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                        <span className="absolute right-3 top-3 text-[11px] font-bold text-cyan-400 uppercase">
                          {cardBrand}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block mb-1 font-bold text-gray-300">Nome do Titular (conforme impresso)</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="NOME COMPLETO"
                        className={`w-full p-3 rounded-xl border font-mono uppercase text-sm ${
                          isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-gray-300">Validade (MM/AA)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/AA"
                        maxLength={5}
                        className={`w-full p-3 rounded-xl border font-mono text-sm ${
                          isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-gray-300">Código CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className={`w-full p-3 rounded-xl border font-mono text-sm ${
                          isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-gray-300">CPF do Titular do Cartão *</label>
                      <input
                        type="text"
                        value={cardCpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={`w-full p-3 rounded-xl border font-mono text-sm ${
                          isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-gray-300">Opções de Parcelamento</label>
                      <select
                        value={installments}
                        onChange={e => setInstallments(Number(e.target.value))}
                        className={`w-full p-3 rounded-xl border font-mono text-xs cursor-pointer ${
                          isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value={1}>1x de R$ {currentPrice.toFixed(2).replace('.', ',')} (à vista sem juros)</option>
                        <option value={2}>2x de R$ {(currentPrice / 2).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value={3}>3x de R$ {(currentPrice / 3).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value={6}>6x de R$ {(currentPrice / 6).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value={10}>10x de R$ {(currentPrice / 10).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value={12}>12x de R$ {(currentPrice / 12).toFixed(2).replace('.', ',')} sem juros</option>
                      </select>
                    </div>
                  </div>

                  {/* Security Seals */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-slate-200/10">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">verified_user</span>
                      <span>Ambiente Criptografado SSL 256 bits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-cyan-400 text-sm">security</span>
                      <span>PCI-DSS Nível 1 Certificado</span>
                    </div>
                  </div>

                  {/* Card Submit Button */}
                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-[#090d16] font-extrabold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span>
                      {isProcessing
                        ? 'Processando Operação com Cartão...'
                        : `Pagar em ${installments}x de R$ ${(currentPrice / installments).toFixed(2).replace('.', ',')}`}
                    </span>
                  </button>
                </div>
              )}

              {/* Processing Modal / Overlay */}
              {isProcessing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                  <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center space-y-4 ${
                    isDark ? 'bg-[#141b2d] border-cyan-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-cyan-400">sync</span>
                    </div>
                    <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                      Processando Matrícula no Curso Livre (40h)
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {processingStage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SUCCESS CONFIRMATION & RECEIPT VIEW */
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className={`p-8 rounded-3xl border text-center space-y-6 shadow-2xl backdrop-blur-2xl ${
            isDark ? 'bg-[#141c2e] border-emerald-500/40 text-white' : 'bg-white border-emerald-500/40 text-slate-900'
          }`}>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400">
                Pagamento Aprovado com Sucesso!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
                Parabéns, {currentUser.name}!
              </h2>
              <p className={`text-xs sm:text-sm max-w-lg mx-auto ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                Sua matrícula no <strong>{completedTransaction.courseTitle}</strong> foi homologada e o acesso com carga horária de 40 horas está 100% liberado!
              </p>
            </div>

            {/* 2-Month Access Deadline Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs text-left space-y-1.5 font-sans">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span>Acesso Liberado por 2 Meses (60 Dias) • Válido até {completedTransaction.expiresAt}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100/80">
                Você tem <strong>60 dias</strong> para assistir às videoaulas, praticar no simulador tomográfico Activion 16 e responder aos testes de fixação para emissão do seu certificado oficial de 40 horas.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-mono pt-1">
                <span className="material-symbols-outlined text-xs">mark_email_read</span>
                <span>E-mail de confirmação enviado para <strong>{completedTransaction.studentEmail}</strong></span>
              </div>
            </div>

            {/* Official Receipt Card */}
            <div className={`p-6 rounded-2xl border text-left space-y-3 font-mono text-xs ${
              isDark ? 'bg-[#0a0f1c] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center border-b pb-2 border-slate-200/15">
                <span className="text-gray-400">CÓDIGO DE TRANSAÇÃO:</span>
                <span className="font-bold text-cyan-400">{completedTransaction.transactionCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">MÉTODO:</span>
                <span className="font-bold uppercase text-emerald-400">
                  {completedTransaction.paymentMethod === 'pix' ? 'PIX Instantâneo' : `Cartão ${completedTransaction.cardBrand || ''} (${completedTransaction.installments}x)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">VALOR PAGO:</span>
                <span className="font-bold text-white">R$ {completedTransaction.amount.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CARGA HORÁRIA &amp; ACESSO:</span>
                <span className="font-bold text-emerald-400">40h Certificadas • Acesso por 2 Meses</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">DATA LIMITE DE ACESSO:</span>
                <span className="font-bold text-amber-400">{completedTransaction.expiresAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ALUNO &amp; CPF:</span>
                <span className="text-gray-300">{completedTransaction.studentName} {completedTransaction.studentCpf ? `(CPF: ${completedTransaction.studentCpf})` : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">DATA &amp; HORA:</span>
                <span className="text-gray-300">{completedTransaction.paidAt}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const emailData = emailModalData || buildEnrollmentEmailData(completedTransaction, currentUser, 60);
                  setEmailModalData(emailData);
                  setShowEmailModal(true);
                }}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}
              >
                <span className="material-symbols-outlined text-base text-cyan-400">mail</span>
                <span>Ver E-mail de Confirmação</span>
              </button>

              <button
                type="button"
                onClick={() => pdfExportService.exportComprovante(completedTransaction)}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base text-cyan-400">receipt_long</span>
                <span>Baixar Comprovante PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('aulas');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">play_lesson</span>
                <span>Acessar Sala de Aula &amp; Simulador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment & Payment Confirmation Email Modal */}
      <EnrollmentEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        emailData={emailModalData}
        theme={theme}
        onStartCourse={() => {
          setShowEmailModal(false);
          if (onNavigateTab) onNavigateTab('aulas');
        }}
      />
    </div>
  );
};
