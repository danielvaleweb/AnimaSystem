import { useState, FormEvent, useEffect } from 'react';
import { 
  X, Lock, ArrowRight, CheckCircle2, User, Building, 
  Phone, Mail, Sparkles, Check, Bot, AlertTriangle
} from 'lucide-react';
import { 
  collection, query, getDocs, doc, setDoc, updateDoc, addDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signInWithPopup, GoogleAuthProvider 
} from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthAndLeadModalsProps {
  isAuthModalOpen: boolean;
  onCloseAuthModal: () => void;
  isDemoModalOpen: boolean;
  onCloseDemoModal: () => void;
  onSuccessAuth: () => void;
}

export function AuthAndLeadModals({
  isAuthModalOpen,
  onCloseAuthModal,
  isDemoModalOpen,
  onCloseDemoModal,
  onSuccessAuth
}: AuthAndLeadModalsProps) {
  // Auth Modal States
  const [authMode, setAuthMode] = useState<'login' | 'register_step1' | 'register_step2' | 'register_new_client' | 'success'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Registration states
  const [regCpf, setRegCpf] = useState('');
  const [matchedClient, setMatchedClient] = useState<any | null>(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [adminOwnerId, setAdminOwnerId] = useState('');

  // New Client Registration fields
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyRazaoSocial, setCompanyRazaoSocial] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyInscricaoEstadual, setCompanyInscricaoEstadual] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyInstagram, setCompanyInstagram] = useState('');
  const [companyYoutube, setCompanyYoutube] = useState('');
  const [companyFacebook, setCompanyFacebook] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyPinterest, setCompanyPinterest] = useState('');
  const [companyTiktok, setCompanyTiktok] = useState('');
  const [companyWorkingHours, setCompanyWorkingHours] = useState('');
  const [activeRegTab, setActiveRegTab] = useState<'personal' | 'company'>('personal');

  // Demo Modal State
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  // CPF formatter
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const handleCpfCheck = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    const cleanCpf = regCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setAuthError('Por favor, informe um CPF válido.');
      return;
    }

    setAuthLoading(true);
    try {
      const q = query(collection(db, 'clients'));
      const snap = await getDocs(q);
      let found: any = null;
      let ownerIdFromDb = '';
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.ownerId && !ownerIdFromDb) {
          ownerIdFromDb = data.ownerId;
        }
        const clientCpf = (data.cpf || '').replace(/\D/g, '');
        if (clientCpf === cleanCpf && cleanCpf !== '') {
          found = { id: docSnap.id, ...data };
        }
      });

      if (ownerIdFromDb) setAdminOwnerId(ownerIdFromDb);

      if (!found) {
        setAuthMode('register_new_client');
        setActiveRegTab('personal');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setClientFirstName('');
        setClientLastName('');
        setClientPhone('');
        return;
      }

      if (found.authUid) {
        setAuthError('Este cadastro já possui uma conta ativa. Faça login na Área do Cliente.');
        return;
      }

      setMatchedClient(found);
      setRegEmail(found.email || '');
      setAuthMode('register_step2');
    } catch (err: any) {
      console.error(err);
      setAuthError('Erro ao consultar CPF. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const cleanCpf = regCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11 && authMode === 'register_step1' && !authLoading) {
      handleCpfCheck();
    }
  }, [regCpf, authMode]);

  const handleClientLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setAuthMode('success');
      setTimeout(() => {
        onCloseAuthModal();
        onSuccessAuth();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos.');
      } else {
        setAuthError('Falha ao autenticar. Verifique seus dados.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCollaboratorLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email !== 'danielvaleweb@gmail.com') {
        await auth.signOut();
        setAuthError('Acesso restrito para administradores autorizados.');
      } else {
        setAuthMode('success');
        setTimeout(() => {
          onCloseAuthModal();
          onSuccessAuth();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Falha ao autenticar com Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regPassword.length < 6) {
      setAuthError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('As senhas não conferem.');
      return;
    }

    setAuthLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = credential.user;
      await updateDoc(doc(db, 'clients', matchedClient.id), {
        authUid: user.uid,
        email: regEmail
      });
      setAuthMode('success');
      setTimeout(() => {
        onCloseAuthModal();
        onSuccessAuth();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setAuthError('Erro ao finalizar o cadastro.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateNewClient = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!clientFirstName.trim() || !clientLastName.trim() || !regEmail || !clientPhone.trim()) {
      setAuthError('Preencha os campos obrigatórios.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    setAuthLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = credential.user;
      const clientFullName = `${clientFirstName.trim()} ${clientLastName.trim()}`;
      const cleanName = companyRazaoSocial.trim() || clientFullName;
      const newId = Math.random().toString(36).substr(2, 9);

      await setDoc(doc(db, 'clients', newId), {
        name: cleanName,
        projectName: cleanName,
        responsible: clientFullName,
        cpf: regCpf,
        email: regEmail,
        phone: clientPhone.trim(),
        authUid: user.uid,
        ownerId: adminOwnerId || '6rbybX9mBAMp8B6gS3zQ8rT0hW32',
        createdAt: new Date().toISOString(),
        status: 'active',
        plan: 'Starter',
        logoInitials: cleanName.substring(0, 2).toUpperCase(),
        domain: '',
        monthlyValue: 60,
        dueDate: 5,
        clientFirstName: clientFirstName.trim(),
        clientLastName: clientLastName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: regEmail.trim(),
        companyRazaoSocial: companyRazaoSocial.trim(),
        companyCnpj: companyCnpj.trim(),
        companyInscricaoEstadual: companyInscricaoEstadual.trim(),
        companyAddress: companyAddress.trim(),
        companyEmail: companyEmail.trim(),
        companyPhone: companyPhone.trim(),
        companyWebsite: companyWebsite.trim(),
        companyInstagram: companyInstagram.trim(),
        companyYoutube: companyYoutube.trim(),
        companyFacebook: companyFacebook.trim(),
        companyLinkedin: companyLinkedin.trim(),
        companyPinterest: companyPinterest.trim(),
        companyTiktok: companyTiktok.trim(),
        companyWorkingHours: companyWorkingHours.trim(),
      });

      setAuthMode('success');
      setTimeout(() => {
        onCloseAuthModal();
        onSuccessAuth();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está em uso.');
      } else {
        setAuthError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitDemo = async (e: FormEvent) => {
    e.preventDefault();
    setDemoLoading(true);
    try {
      const uid = auth.currentUser?.uid || 'anonymous';
      await addDoc(collection(db, 'leads'), {
        ownerId: uid,
        name: demoName,
        email: demoEmail,
        phone: demoPhone,
        company: demoCompany || '-',
        message: demoMessage || 'Solicitou agendamento de demonstração da IA',
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setDemoSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <>
      {/* ---------------- AUTH MODAL ---------------- */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8"
            >
              <button
                onClick={onCloseAuthModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* SUCCESS VIEW */}
              {authMode === 'success' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Autenticado com Sucesso!</h3>
                  <p className="text-sm text-slate-600">Redirecionando para o seu painel de controle...</p>
                </div>
              )}

              {/* LOGIN VIEW */}
              {authMode === 'login' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Área do Cliente</h3>
                    <p className="text-xs text-slate-500 mt-1">Acesse seus projetos, relatórios e ferramentas de IA</p>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleClientLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        placeholder="Sua senha de acesso"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Entrando...' : 'Entrar na Conta'}
                    </button>
                  </form>

                  <div className="relative border-t border-slate-200 my-4 text-center">
                    <span className="bg-white px-3 text-xs text-slate-400 -top-2 relative">ou</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setAuthMode('register_step1');
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Primeiro acesso? Cadastre ou vincule seu CPF
                    </button>

                    <button
                      type="button"
                      onClick={handleCollaboratorLogin}
                      disabled={authLoading}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Acesso Administrador via Google</span>
                    </button>
                  </div>
                </div>
              )}

              {/* REGISTER STEP 1 (CPF CHECK) */}
              {authMode === 'register_step1' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">Identificação por CPF</h3>
                    <p className="text-xs text-slate-500 mt-1">Informe seu CPF para localizar seu cadastro ou criar uma nova conta</p>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleCpfCheck} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CPF</label>
                      <input
                        type="text"
                        required
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Verificando...' : 'Continuar'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthMode('login');
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
                  >
                    Voltar para Login
                  </button>
                </div>
              )}

              {/* REGISTER STEP 2 (LINK EXISTING CLIENT) */}
              {authMode === 'register_step2' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">Defina seu Acesso</h3>
                    <p className="text-xs text-slate-500 mt-1">Cadastro localizado! Defina seu e-mail e senha de acesso</p>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleCompleteRegistration} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Senha (Mínimo 6 dígitos)</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all cursor-pointer"
                    >
                      {authLoading ? 'Ativando...' : 'Ativar Conta'}
                    </button>
                  </form>
                </div>
              )}

              {/* REGISTER NEW CLIENT */}
              {authMode === 'register_new_client' && (
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">Novo Cadastro</h3>
                    <p className="text-xs text-slate-500 mt-1">Crie sua conta para começar</p>
                  </div>

                  {/* Tabs: Personal vs Company */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveRegTab('personal')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        activeRegTab === 'personal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Dados Pessoais
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRegTab('company')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        activeRegTab === 'company' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Dados da Empresa (Opcional)
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleCreateNewClient} className="space-y-4">
                    {activeRegTab === 'personal' ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome *</label>
                            <input
                              type="text"
                              required
                              value={clientFirstName}
                              onChange={(e) => setClientFirstName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome *</label>
                            <input
                              type="text"
                              required
                              value={clientLastName}
                              onChange={(e) => setClientLastName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                          <input
                            type="text"
                            required
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                            placeholder="(00) 00000-0000"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Senha *</label>
                            <input
                              type="password"
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                              placeholder="Mínimo 6 dígitos"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar *</label>
                            <input
                              type="password"
                              required
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Fantasia</label>
                          <input
                            type="text"
                            value={companyRazaoSocial}
                            onChange={(e) => setCompanyRazaoSocial(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ</label>
                            <input
                              type="text"
                              value={companyCnpj}
                              onChange={(e) => setCompanyCnpj(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono"
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                            <input
                              type="text"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                              placeholder="www.empresa.com.br"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo</label>
                          <input
                            type="text"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all cursor-pointer"
                      >
                        {authLoading ? 'Criando Conta...' : 'Finalizar e Acessar'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- DEMO SCHEDULE MODAL ---------------- */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8"
            >
              <button
                onClick={() => {
                  onCloseDemoModal();
                  setDemoSuccess(false);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {demoSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Demonstração Solicitada!</h3>
                  <p className="text-sm text-slate-600 max-w-xs mx-auto">
                    Nossa equipe entrará em contato pelo seu WhatsApp em poucos instantes para apresentar a plataforma.
                  </p>
                  <button
                    onClick={() => {
                      onCloseDemoModal();
                      setDemoSuccess(false);
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>DEMONSTRAÇÃO PERSONALIZADA</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Agendar Demonstração</h3>
                    <p className="text-xs text-slate-500 mt-1">Veja a IA atendendo no WhatsApp e o CRM funcionando na prática</p>
                  </div>

                  <form onSubmit={handleSubmitDemo} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome *</label>
                      <input
                        type="text"
                        required
                        value={demoName}
                        onChange={(e) => setDemoName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                        placeholder="Nome e Sobrenome"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp *</label>
                        <input
                          type="text"
                          required
                          value={demoPhone}
                          onChange={(e) => setDemoPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
                        <input
                          type="email"
                          required
                          value={demoEmail}
                          onChange={(e) => setDemoEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Empresa</label>
                      <input
                        type="text"
                        value={demoCompany}
                        onChange={(e) => setDemoCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                        placeholder="Nome da sua imobiliária ou empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mensagem ou Principal Desafio (Opcional)</label>
                      <textarea
                        rows={2}
                        value={demoMessage}
                        onChange={(e) => setDemoMessage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        placeholder="Ex: Quero automatizar o primeiro atendimento no WhatsApp e organizar os leads."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={demoLoading}
                      className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {demoLoading ? 'Enviando...' : 'Quero Agendar Demonstração'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
