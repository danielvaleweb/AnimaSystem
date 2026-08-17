import { 
  ArrowRight, Server, CloudLightning, ShieldCheck, Database, LayoutDashboard,
  Activity, Users, DollarSign, MessageSquare, ListTree, AlertTriangle, CheckCircle2,
  Lock, BarChart, ChevronDown, Check, Menu, X, ArrowUpRight, Hash, AtSign, Plus, Star,
  Umbrella, Aperture, Leaf, Network, Wind, Zap, Hexagon
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../utils';
import { LightningLogo } from '../LightningLogo';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [hoveredNetworkNode, setHoveredNetworkNode] = useState<{
    id: number;
    name: string;
    desc: string;
    status: string;
    cpu: string;
    latency: string;
    x: number;
    y: number;
  } | null>(null);

  const networkNodes = [
    { id: 1, name: 'Marcenaria Sheiffer', desc: 'Monitoramento NOC Ativo', status: 'Online', cpu: '1.4%', latency: '4ms', x: 300, y: 60 },
    { id: 2, name: 'E-commerce Premium', desc: 'Prevenção de Gargalos de Venda', status: 'Seguro', cpu: '3.1%', latency: '8ms', x: 470, y: 130 },
    { id: 3, name: 'Portal Institucional', desc: 'Redundância Dinâmica Web', status: 'Excelente', cpu: '0.9%', latency: '3ms', x: 540, y: 300 },
    { id: 4, name: 'CRM Central Integrado', desc: 'Banco de Dados Replicado', status: 'Protegido', cpu: '4.8%', latency: '11ms', x: 470, y: 470 },
    { id: 5, name: 'Checkout Expresso', desc: 'Cluster Isolado e Seguro', status: 'Online', cpu: '2.2%', latency: '5ms', x: 300, y: 540 },
    { id: 6, name: 'Módulo de Pagamentos', desc: 'Gateway Criptografado GCP', status: 'Impenetrável', cpu: '0.7%', latency: '6ms', x: 130, y: 470 },
    { id: 7, name: 'Agência Digital Sol', desc: 'Auto-Scaling de Cache Ativo', status: 'Excelente', cpu: '1.1%', latency: '2ms', x: 60, y: 300 },
    { id: 8, name: 'Gestor de Relatórios', desc: 'SLA de Disponibilidade 99.9%', status: 'Online', cpu: '3.9%', latency: '10ms', x: 130, y: 130 },
  ];

  const getCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = mx - dy * 0.12;
    const cy = my + dx * 0.12;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Auth Modal States
  const [authMode, setAuthMode] = useState<'login' | 'register_step1' | 'register_step2' | 'register_new_client' | 'success'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Registration states
  const [regCpf, setRegCpf] = useState('');

  // Verified client data
  const [matchedClient, setMatchedClient] = useState<any | null>(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // New Client registration states
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adminOwnerId, setAdminOwnerId] = useState('');

  // Additional Client Details requested
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Optional Company Details requested
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

  // Tab state for multi-section registration form
  const [activeRegTab, setActiveRegTab] = useState<'personal' | 'company'>('personal');

  // Logged in user states for top-right menu
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserPortalLink, setCurrentUserPortalLink] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Let's determine if this user is a client or collaborator
        try {
          const q = query(collection(db, 'clients'), where('authUid', '==', user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const clientData = snap.docs[0].data();
            const firstName = clientData.clientFirstName || clientData.responsible?.split(' ')[0] || 'Cliente';
            setCurrentUserName(firstName);
            setCurrentUserPortalLink(`/cliente/${snap.docs[0].id}`);
          } else {
            // Collaborator or admin (e.g. Daniel)
            const name = user.displayName?.split(' ')[0] || (user.email === 'danielvaleweb@gmail.com' ? 'Daniel' : 'Admin');
            setCurrentUserName(name);
            setCurrentUserPortalLink('/admin');
          }
        } catch (err) {
          console.error("Error fetching user details in landing page", err);
          setCurrentUserName(user.displayName?.split(' ')[0] || 'Admin');
          setCurrentUserPortalLink('/admin');
        }
      } else {
        setCurrentUser(null);
        setCurrentUserName('');
        setCurrentUserPortalLink('');
      }
    });
    return () => unsubscribe();
  }, []);

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

      if (ownerIdFromDb) {
        setAdminOwnerId(ownerIdFromDb);
      }

      if (!found) {
        // CPF not registered as a client yet: transition to Register New Client with Welcome message!
        setAuthMode('register_new_client');
        setActiveRegTab('personal');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setNewCompanyName('');
        setNewResponsible('');
        setNewPhone('');
        
        // Clear additional client & company states
        setClientFirstName('');
        setClientLastName('');
        setClientPhone('');
        setCompanyRazaoSocial('');
        setCompanyCnpj('');
        setCompanyInscricaoEstadual('');
        setCompanyAddress('');
        setCompanyEmail('');
        setCompanyPhone('');
        setCompanyWebsite('');
        setCompanyInstagram('');
        setCompanyYoutube('');
        setCompanyFacebook('');
        setCompanyLinkedin('');
        setCompanyPinterest('');
        setCompanyTiktok('');
        setCompanyWorkingHours('');
        return;
      }

      if (found.authUid) {
        setAuthError('Este projeto já possui uma conta de acesso atrelada! Por favor, utilize o login da Área do Cliente.');
        return;
      }

      setMatchedClient(found);
      setRegEmail(found.email || '');
      setAuthMode('register_step2');
    } catch (err: any) {
      console.error(err);
      setAuthError('Erro ao buscar o CPF. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auto check CPF when it reaches 11 digits
  useEffect(() => {
    const cleanCpf = regCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11 && authMode === 'register_step1' && !authLoading) {
      handleCpfCheck();
    }
  }, [regCpf, authMode]);

  const handleCreateNewClient = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!clientFirstName.trim()) {
      setAuthError('Por favor, informe o Nome do cliente.');
      return;
    }
    if (!clientLastName.trim()) {
      setAuthError('Por favor, informe o Sobrenome do cliente.');
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      setAuthError('Por favor, informe um e-mail válido para o cliente.');
      return;
    }
    if (!clientPhone.trim()) {
      setAuthError('Por favor, informe o Telefone do cliente.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('A senha precisa conter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    setAuthLoading(true);
    try {
      // 1. Create the Firebase Auth credentials
      const credential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = credential.user;

      // 2. Derive initials and domain
      const clientFullName = `${clientFirstName.trim()} ${clientLastName.trim()}`;
      const cleanName = (companyRazaoSocial.trim() || clientFullName);
      const initials = cleanName.substring(0, 2).toUpperCase();
      const safeDomain = ""; // Eliminado link default .animasystem.com

      // 3. Create document in /clients collection
      const newId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'clients', newId), {
        name: cleanName,
        projectName: cleanName,
        responsible: clientFullName,
        cpf: regCpf,
        email: regEmail,
        phone: clientPhone.trim(),
        authUid: user.uid,
        ownerId: adminOwnerId || '6rbybX9mBAMp8B6gS3zQ8rT0hW32', // fallback admin owner UID
        createdAt: new Date().toISOString(),
        status: 'active',
        plan: 'Nenhum', // Inicia sem contratações/plano para simular a tela triste e intuitiva de planos
        logoInitials: initials,
        domain: safeDomain,
        monthlyValue: 0,
        dueDate: 5,

        // Detailed Client fields
        clientFirstName: clientFirstName.trim(),
        clientLastName: clientLastName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: regEmail.trim(),

        // Optional Company fields
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

      setCurrentUserName(clientFirstName.trim());
      setAuthMode('success');
      setTimeout(() => {
        setIsModalOpen(false);
        onEnter();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está sendo utilizado por outra conta.');
      } else {
        setAuthError('Erro ao criar o cadastro de cliente. Tente novamente.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleClientLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;

      let nameToGreet = 'Cliente';
      try {
        const q = query(collection(db, 'clients'), where('authUid', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const clientData = snap.docs[0].data();
          nameToGreet = clientData.clientFirstName || clientData.responsible?.split(' ')[0] || 'Cliente';
        } else {
          nameToGreet = user.email?.split('@')[0] || 'Cliente';
        }
      } catch (dbErr) {
        console.error("Error querying client name", dbErr);
        nameToGreet = user.email?.split('@')[0] || 'Cliente';
      }

      setCurrentUserName(nameToGreet);
      setAuthMode('success');
      setTimeout(() => {
        setIsModalOpen(false);
        onEnter();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos.');
      } else {
        setAuthError('Falha no login. Verifique seus dados.');
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
        setAuthError('Acesso negado. Apenas para administradores autorizados');
      } else {
        const nameToGreet = user.displayName?.split(' ')[0] || 'Daniel';
        setCurrentUserName(nameToGreet);
        setAuthMode('success');
        setTimeout(() => {
          setIsModalOpen(false);
          onEnter();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Falha ao autenticar administrador com Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (regPassword.length < 6) {
      setAuthError('A senha precisa conter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      setAuthError('Por favor, informe um e-mail válido.');
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

      const greetingName = matchedClient.clientFirstName || matchedClient.responsible?.split(' ')[0] || 'Cliente';
      setCurrentUserName(greetingName);
      setAuthMode('success');
      setTimeout(() => {
        setIsModalOpen(false);
        onEnter();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está sendo utilizado por outra conta.');
      } else {
        setAuthError('Erro ao finalizar o cadastro. Tente novamente.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitConsultoria = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const uid = auth.currentUser?.uid || 'anonymous';
      await addDoc(collection(db, 'leads'), {
        ownerId: uid, 
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: '-', 
        message: formData.message,
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setFormSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [heroImage, setHeroImage] = useState("");
  const [brandName, setBrandName] = useState("AnimaSystem");
  const [heroTitle, setHeroTitle] = useState("Criação inteligente. \n Estratégia real. \n Na palma da sua mão.");
  const [heroDescription, setHeroDescription] = useState("Ajudamos empresas e marcas a estruturar completamente a sua presença online. Da validação da ideia até sistemas escaláveis e apps interativos.");
  const [dashboardClients, setDashboardClients] = useState<any[]>([]);
  const [marqueeMode, setMarqueeMode] = useState<"auto" | "manual">("auto");
  const [customMarqueeItems, setCustomMarqueeItems] = useState<any[]>([]);

  // Customizable Landing Page Sections:
  // 1. Nossos Serviços
  const [servicesTag, setServicesTag] = useState("NOSSOS SERVIÇOS");
  const [servicesCard1Category, setServicesCard1Category] = useState("Dev & Apps");
  const [servicesCard1Title, setServicesCard1Title] = useState("Desenvolvimento de Plataformas Web e Mobile");
  const [servicesCard1Image, setServicesCard1Image] = useState("https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80");
  const [servicesCard2Category, setServicesCard2Category] = useState("Consultoria");
  const [servicesCard2Title, setServicesCard2Title] = useState("Estratégia Real e Crescimento Sustentável");
  const [servicesCard2Image, setServicesCard2Image] = useState("https://images.unsplash.com/photo-1556761175-5973e4499b70?w=800&q=80");
  const [servicesCard3Category, setServicesCard3Category] = useState("UX & UI");
  const [servicesCard3Title, setServicesCard3Title] = useState("Design Moderno e Focado na Conversão");
  const [servicesCard3Image, setServicesCard3Image] = useState("https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80");

  // 2. Núcleo Google Cloud
  const [googleTag, setGoogleTag] = useState("NÚCLEO GOOGLE CLOUD");
  const [googleTitle, setGoogleTitle] = useState("Estrutura blindada e redundante via Google Cloud.");
  const [googleDescription, setGoogleDescription] = useState("Cada cliente corporativo opera conectado ao Anima System, nosso núcleo central de orquestração. Hospedado em múltiplos clusters seguros do Google Cloud, eliminamos completamente riscos de quedas de site, oscilações no checkout e lentidões inesperadas.");
  const [googlePillar1Title, setGooglePillar1Title] = useState("Segurança de Nível Bancário");
  const [googlePillar1Desc, setGooglePillar1Desc] = useState("Proteção ativa contra ataques DDoS, criptografia de tráfego SSL/TLS e isolamento absoluto de dados.");
  const [googlePillar2Title, setGooglePillar2Title] = useState("Auto-Scaling Inteligente (Sem Travamentos)");
  const [googlePillar2Desc, setGooglePillar2Desc] = useState("Sua infraestrutura se expande automaticamente em milissegundos para aguentar picos de tráfego ou campanhas virais.");
  const [googlePillar3Title, setGooglePillar3Title] = useState("Redundância Crítica Multi-Região");
  const [googlePillar3Desc, setGooglePillar3Desc] = useState("Se algum hardware global apresentar instabilidade, outro assume instantaneamente sem que ninguém perceba.");

  // 3. Sobre Nós
  const [aboutTag, setAboutTag] = useState("SOBRE NÓS");
  const [aboutTitle, setAboutTitle] = useState("Nós ajudamos empresas a tomar decisões melhores e crescer com clareza.");
  const [aboutDescription, setAboutDescription] = useState("Trazemos estratégias com propósito, insights acionáveis e processos modernos para ajudar você a validar, lançar e escalar seus produtos com absoluta confiança no mercado digital.");
  const [aboutImage, setAboutImage] = useState("https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80");

  // 4. Planos
  const [plansTag, setPlansTag] = useState("NOSSOS PLANOS");
  const [plansTitle, setPlansTitle] = useState("Planos flexíveis para cada estágio do seu negócio");
  const [plansDescription, setPlansDescription] = useState("Comece pequeno ou escale rapidamente. Escolha o plano que melhor se adapta às suas necessidades e ao seu momento no mercado.");
  const [plan1Name, setPlan1Name] = useState("Starter");
  const [plan1Desc, setPlan1Desc] = useState("Para freelancers e microsaas lidarem com até 3 apps ativos.");
  const [plan1Price, setPlan1Price] = useState("Grátis");
  const [plan1Features, setPlan1Features] = useState("Até 3 Clientes\nMonito. Firebase (Limitado)\nIntegração Asaas Básica");
  const [plan2Name, setPlan2Name] = useState("Professional");
  const [plan2Desc, setPlan2Desc] = useState("A ferramenta completa para agências lidarem com escala.");
  const [plan2Price, setPlan2Price] = useState("R$ 149");
  const [plan2Features, setPlan2Features] = useState("Clientes Ilimitados\nNOC Firestore Em Tempo Real\nSistema de Tickets L1/L2\nFaturamento Automático PIX\nMúltiplas Contas Admin");
  const [plan3Name, setPlan3Name] = useState("Enterprise");
  const [plan3Desc, setPlan3Desc] = useState("Monitoramento on-premises em instâncias separadas.");
  const [plan3Price, setPlan3Price] = useState("Custom");
  const [plan3Features, setPlan3Features] = useState("Implantação Self-hosted\nExportação BigQuery Dedicada\nSLA & Suporte 24/7");

  // 5. FAQ
  const [faqTitle, setFaqTitle] = useState("Perguntas Frequentes");
  const [faqSubtitle, setFaqSubtitle] = useState("Tire suas dúvidas sobre o funcionamento e segurança da AnimaSystem.");
  const [faq1Question, setFaq1Question] = useState("Preciso dar acesso total ao meu Firebase?");
  const [faq1Answer, setFaq1Answer] = useState("Não. A AnimaSystem utiliza o princípio do Menor Privilégio (Least Privilege). Solicitamos apenas a permissão 'monitoring.viewer' para ler contadores de uso, sem qualquer acesso aos dados dos seus usuários ou do Firestore.");
  const [faq2Question, setFaq2Question] = useState("Como funciona a integração financeira?");
  const [faq2Answer, setFaq2Answer] = useState("Temos integração nativa com o Asaas. Configurando sua chave de API, a AnimaSystem gera cobranças automáticas via PIX, Boleto e Cartão de Crédito, além de gerenciar inadimplência e emitir alertas de vencimento automaticamente.");
  const [faq3Question, setFaq3Question] = useState("A AnimaSystem suporta dezenas de projetos?");
  const [faq3Answer, setFaq3Answer] = useState("Sim. Nossa arquitetura Multi-Tenant com ingestão via Polling foi desenhada para escalar e monitorar dezenas ou até centenas de projetos Firebase simultâneos com baixíssimo custo operacional.");
  const [faq4Question, setFaq4Question] = useState("Posso criar contas para minha equipe?");
  const [faq4Answer, setFaq4Answer] = useState("Com certeza. Nos planos Pro e Enterprise, você pode criar contas para o seu time de suporte com níveis de acesso granulares (Admin, Financeiro, NOC, Suporte L1/L2).");

  // 6. Rodapé
  const [footerCtaTitle, setFooterCtaTitle] = useState("Pronto para tomar o controle?");
  const [footerCtaDesc, setFooterCtaDesc] = useState("Centralize hoje mesmo a operação dos seus softwares. Sem planilhas, sem dezenas de abas soltas.");
  const [footerCtaButton, setFooterCtaButton] = useState("Acessar Portal do Cliente");
  const [footerBrandNarrative, setFooterBrandNarrative] = useState("O sistema ERP e Monitoramento focado na redução de atrito para agências digitais e criadores de Software.");
  const [footerColumn1Title, setFooterColumn1Title] = useState("Produto");
  const [footerColumn2Title, setFooterColumn2Title] = useState("Recursos");
  const [footerColumn3Title, setFooterColumn3Title] = useState("Empresa");
  const [footerCopyright, setFooterCopyright] = useState("© 2026 AnimaSystem Inc. Todos os direitos reservados.");
  const [footerStatusText, setFooterStatusText] = useState("Todos os Serviços Online (Status: Verde)");

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.heroImage) setHeroImage(data.heroImage);
        if (data.brandName) setBrandName(data.brandName);
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroDescription) setHeroDescription(data.heroDescription);
        if (data.marqueeMode) setMarqueeMode(data.marqueeMode);
        if (data.customMarqueeItems) setCustomMarqueeItems(data.customMarqueeItems);

        // 1. Serviços
        if (data.servicesTag) setServicesTag(data.servicesTag);
        if (data.servicesCard1Category) setServicesCard1Category(data.servicesCard1Category);
        if (data.servicesCard1Title) setServicesCard1Title(data.servicesCard1Title);
        if (data.servicesCard1Image) setServicesCard1Image(data.servicesCard1Image);
        if (data.servicesCard2Category) setServicesCard2Category(data.servicesCard2Category);
        if (data.servicesCard2Title) setServicesCard2Title(data.servicesCard2Title);
        if (data.servicesCard2Image) setServicesCard2Image(data.servicesCard2Image);
        if (data.servicesCard3Category) setServicesCard3Category(data.servicesCard3Category);
        if (data.servicesCard3Title) setServicesCard3Title(data.servicesCard3Title);
        if (data.servicesCard3Image) setServicesCard3Image(data.servicesCard3Image);

        // 2. Google Cloud Core
        if (data.googleTag) setGoogleTag(data.googleTag);
        if (data.googleTitle) setGoogleTitle(data.googleTitle);
        if (data.googleDescription) setGoogleDescription(data.googleDescription);
        if (data.googlePillar1Title) setGooglePillar1Title(data.googlePillar1Title);
        if (data.googlePillar1Desc) setGooglePillar1Desc(data.googlePillar1Desc);
        if (data.googlePillar2Title) setGooglePillar2Title(data.googlePillar2Title);
        if (data.googlePillar2Desc) setGooglePillar2Desc(data.googlePillar2Desc);
        if (data.googlePillar3Title) setGooglePillar3Title(data.googlePillar3Title);
        if (data.googlePillar3Desc) setGooglePillar3Desc(data.googlePillar3Desc);

        // 3. Sobre Nós
        if (data.aboutTag) setAboutTag(data.aboutTag);
        if (data.aboutTitle) setAboutTitle(data.aboutTitle);
        if (data.aboutDescription) setAboutDescription(data.aboutDescription);
        if (data.aboutImage) setAboutImage(data.aboutImage);

        // 4. Planos
        if (data.plansTag) setPlansTag(data.plansTag);
        if (data.plansTitle) setPlansTitle(data.plansTitle);
        if (data.plansDescription) setPlansDescription(data.plansDescription);
        if (data.plan1Name) setPlan1Name(data.plan1Name);
        if (data.plan1Desc) setPlan1Desc(data.plan1Desc);
        if (data.plan1Price) setPlan1Price(data.plan1Price);
        if (data.plan1Features) setPlan1Features(data.plan1Features);
        if (data.plan2Name) setPlan2Name(data.plan2Name);
        if (data.plan2Desc) setPlan2Desc(data.plan2Desc);
        if (data.plan2Price) setPlan2Price(data.plan2Price);
        if (data.plan2Features) setPlan2Features(data.plan2Features);
        if (data.plan3Name) setPlan3Name(data.plan3Name);
        if (data.plan3Desc) setPlan3Desc(data.plan3Desc);
        if (data.plan3Price) setPlan3Price(data.plan3Price);
        if (data.plan3Features) setPlan3Features(data.plan3Features);

        // 5. FAQ
        if (data.faqTitle) setFaqTitle(data.faqTitle);
        if (data.faqSubtitle) setFaqSubtitle(data.faqSubtitle);
        if (data.faq1Question) setFaq1Question(data.faq1Question);
        if (data.faq1Answer) setFaq1Answer(data.faq1Answer);
        if (data.faq2Question) setFaq2Question(data.faq2Question);
        if (data.faq2Answer) setFaq2Answer(data.faq2Answer);
        if (data.faq3Question) setFaq3Question(data.faq3Question);
        if (data.faq3Answer) setFaq3Answer(data.faq3Answer);
        if (data.faq4Question) setFaq4Question(data.faq4Question);
        if (data.faq4Answer) setFaq4Answer(data.faq4Answer);

        // 6. Rodapé
        if (data.footerCtaTitle) setFooterCtaTitle(data.footerCtaTitle);
        if (data.footerCtaDesc) setFooterCtaDesc(data.footerCtaDesc);
        if (data.footerCtaButton) setFooterCtaButton(data.footerCtaButton);
        if (data.footerBrandNarrative) setFooterBrandNarrative(data.footerBrandNarrative);
        if (data.footerColumn1Title) setFooterColumn1Title(data.footerColumn1Title);
        if (data.footerColumn2Title) setFooterColumn2Title(data.footerColumn2Title);
        if (data.footerColumn3Title) setFooterColumn3Title(data.footerColumn3Title);
        if (data.footerCopyright) setFooterCopyright(data.footerCopyright);
        if (data.footerStatusText) setFooterStatusText(data.footerStatusText);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setDashboardClients(list);
    }, (error) => {
      console.error("Error fetching clients for marquee loop:", error);
    });
    return unsubscribe;
  }, []);

  const activeMarqueeItems = marqueeMode === 'manual' ? customMarqueeItems : dashboardClients;

  return (
    <div className="min-h-screen bg-[#0a1007] text-[#f4fbf0] font-sans selection:bg-[#D7FE03]/30 overflow-x-hidden">
      
      {/* Background Base */}
      <div className="fixed inset-0 bg-[#0a1007] pointer-events-none z-0" />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 w-full z-50 pt-6 px-6 lg:px-12"
      >
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <LightningLogo className="w-8 h-8" />
            </div>
             <span className="text-xl tracking-tight hidden sm:block text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
               <span className="font-light">{brandName.includes(' ') ? brandName.split(' ')[0] : brandName.substring(0, Math.ceil(brandName.length / 2))}</span>
               <span className="font-bold">{brandName.includes(' ') ? brandName.split(' ').slice(1).join(' ') : brandName.substring(Math.ceil(brandName.length / 2))}</span>
             </span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-widest font-semibold text-white/85 absolute left-1/2 -translate-x-1/2">
            <a href="#home" className="hover:text-[#D7FE03] transition-colors">Home</a>
            <a href="#servicos" className="hover:text-[#D7FE03] transition-colors">Serviços</a>
            <a href="#planos" className="hover:text-[#D7FE03] transition-colors">Planos</a>
            <a href="#sobre" className="hover:text-[#D7FE03] transition-colors">Sobre Nós</a>
          </div>

          <div className="flex items-center gap-4">
             <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
             {currentUser ? (
               <div className="hidden md:flex flex-col items-end text-right">
                 <span className="text-[13px] font-bold text-white">Olá, {currentUserName}!</span>
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                   <button 
                     onClick={() => navigate(currentUserPortalLink)}
                     className="hover:text-[#D7FE03] transition-colors cursor-pointer uppercase tracking-widest font-bold"
                   >
                     Meus pedidos
                   </button>
                   <span className="text-zinc-600">•</span>
                   <button 
                     onClick={async () => {
                       await auth.signOut();
                       navigate('/');
                     }}
                     className="hover:text-rose-400 transition-colors cursor-pointer uppercase tracking-widest font-bold"
                   >
                     Sair
                   </button>
                 </div>
               </div>
             ) : (
               <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setIsModalOpen(true)}
                 className="hidden md:block bg-[#D7FE03] hover:bg-[#c4e602] text-black px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(215,254,3,0.3)] cursor-pointer"
               >
                 Login
               </motion.button>
             )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-24 bg-[#0a1007] z-40 p-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-medium text-white text-center">
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
              <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre Nós</a>
              {currentUser ? (
                <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-zinc-900/40">
                  <span className="text-[15px] font-bold text-white">Olá, {currentUserName}!</span>
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-zinc-400 mt-1">
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(currentUserPortalLink);
                      }}
                      className="hover:text-[#D7FE03] transition-colors cursor-pointer uppercase tracking-widest font-bold"
                    >
                      Meus pedidos
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button 
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await auth.signOut();
                        navigate('/');
                      }}
                      className="hover:text-rose-400 transition-colors cursor-pointer uppercase tracking-widest font-bold"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setMobileMenuOpen(false); setIsModalOpen(true); }} className="mt-4 bg-[#D7FE03] text-[#0a1007] py-3 rounded-full font-bold uppercase text-sm shadow-[0_0_40px_rgba(215,254,3,0.3)]">
                    Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main id="home" className="relative z-10 pt-[230px] pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center border-b border-zinc-900/30">
        
        {/* Abstract Image Background Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {heroImage && (
              <img 
                src={heroImage} 
                alt="Hero Background" 
                className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-luminosity"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1007]/80 to-[#0a1007]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D7FE03]/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-4xl mx-auto w-full relative z-10">
          
          {/* Floating Tags Container */}
          <div className="relative w-full h-0">
             
             {/* Tag 1 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
               className="absolute -top-32 left-0 sm:left-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_4s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#5fc2fe] flex items-center justify-center shrink-0">
                  <Hash strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Design Moderno</span>
             </motion.div>

             {/* Tag 2 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
               className="absolute -top-10 right-0 sm:right-20 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_5s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#D7FE03] flex items-center justify-center shrink-0">
                  <AtSign strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Estratégia Real</span>
             </motion.div>

             {/* Tag 3 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.6 }}
               className="absolute top-20 -left-4 sm:-left-20 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_3s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#e8fa56] flex items-center justify-center shrink-0">
                  <Plus strokeWidth={3} className="w-[14px] h-[14px] text-zinc-950 relative top-[0.5px]" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Crescimento Rápido</span>
             </motion.div>

             {/* Tag 4 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.7 }}
               className="absolute top-10 -right-4 sm:-right-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_4.5s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#fe7f8d] flex items-center justify-center shrink-0">
                  <DollarSign strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Profissional</span>
             </motion.div>

             {/* Tag 5 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.8 }}
               className="absolute top-44 right-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_3.5s_infinite] hidden sm:flex"
             >
                <div className="w-6 h-6 rounded-full bg-[#c084fe] flex items-center justify-center shrink-0">
                  <Star fill="currentColor" strokeWidth={0} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Inovação Digital</span>
             </motion.div>

          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-center space-y-8 mt-10"
          >
            <h1 className="font-sans font-medium text-5xl md:text-6xl lg:text-[72px] tracking-tight leading-[1.05] text-white whitespace-pre-line">
              {heroTitle || "Criação inteligente. \n Estratégia real. \n Na palma da sua mão."}
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
              {heroDescription || "Ajudamos empresas e marcas a estruturar completamente a sua presença online. Da validação da ideia até sistemas escaláveis e apps interativos."}
            </p>

            <div className="pt-8 flex items-center justify-center">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(215,254,3,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/portfolio')} 
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/20 text-white font-medium px-8 py-4 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.3)] text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
              >
                Ver Portfólio
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Brand Marquee */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-10 left-0 w-full overflow-hidden flex whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        >
           <div className="flex w-max animate-marquee items-center gap-6">
             {activeMarqueeItems.length > 0 ? (
               Array(Math.max(2, Math.ceil(12 / activeMarqueeItems.length))).fill(activeMarqueeItems).flat().map((client, idx) => (
                 <div key={`${client.id}-${idx}`} className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20 shrink-0">
                   {client.logoUrl ? (
                     <img src={client.logoUrl} alt={client.name} referrerPolicy="no-referrer" className="w-7 h-7 object-contain" />
                   ) : (
                     <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                       {client.logoInitials || client.name?.substring(0, 2).toUpperCase()}
                     </div>
                   )}
                   <span>{client.name}</span>
                 </div>
               ))
             ) : (
               <div className="flex items-center gap-4 pr-4 shrink-0">
                 <div className="px-8 py-4 bg-white/5 backdrop-blur-md text-zinc-400 rounded-2xl border border-white/10 text-sm font-medium">
                   Nenhum cliente cadastrado ainda no painel
                 </div>
               </div>
             )}
           </div>
        </motion.div>

      </main>

      {/* Services Cards Section */}
      <section id="servicos" className="bg-white relative z-10 py-32 pb-12 overflow-hidden border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="mb-12"
           >
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-[#D7FE03] rounded-full"></div> {servicesTag}
              </span>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Card 1 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
               className="bg-[#f0f2ec] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D7FE03]/10 transition-all duration-500 border border-transparent hover:border-zinc-300"
             >
               <div className="flex justify-between items-start z-10">
                 <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest border border-zinc-300/50 px-4 py-1.5 rounded-full bg-white">{servicesCard1Category}</span>
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                 </div>
               </div>
               
               <div className="z-10 mt-12 mb-auto">
                 <h3 className="text-[26px] font-medium text-zinc-900 leading-[1.1] pr-4 max-w-[280px]">
                    {servicesCard1Title}
                 </h3>
               </div>

               <div className="absolute bottom-0 inset-x-0 h-[45%] p-3">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img src={servicesCard1Image} alt="Dev" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
               </div>
             </motion.div>

             {/* Card 2 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
               className="bg-[#D7FE03] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D7FE03]/20 transition-all duration-500"
             >
               <div className="absolute top-0 inset-x-0 h-[55%] p-4">
                 <div className="w-full h-full rounded-[40px] rounded-tr-[80px] rounded-bl-[80px] overflow-hidden relative border-4 border-[#D7FE03]/20">
                   <img src={servicesCard2Image} alt="Estratégia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[30%] group-hover:grayscale-0" referrerPolicy="no-referrer" />
                 </div>
               </div>

               <div className="flex justify-between items-end z-10 mt-auto relative">
                  <div>
                    <span className="text-[#0a1007]/60 border border-[#0a1007]/20 text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full mb-6 inline-block bg-[#D7FE03]">{servicesCard2Category}</span>
                    <h3 className="text-[26px] font-medium text-[#0a1007] leading-[1.1] pr-4 max-w-[240px]">
                      {servicesCard2Title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-transparent group-hover:border-[#0a1007]/10 transition-all">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                  </div>
               </div>
             </motion.div>

             {/* Card 3 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
               className="bg-[#f0f2ec] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D7FE03]/10 transition-all duration-500 border border-transparent hover:border-zinc-300"
             >
               <div className="flex justify-between items-start z-10">
                 <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest border border-zinc-300/50 px-4 py-1.5 rounded-full bg-white">{servicesCard3Category}</span>
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                 </div>
               </div>
               
               <div className="z-10 mt-12 mb-auto">
                 <h3 className="text-[26px] font-medium text-zinc-900 leading-[1.1] pr-4 max-w-[280px]">
                    {servicesCard3Title}
                 </h3>
               </div>

               <div className="absolute bottom-0 inset-x-0 h-[45%] p-3">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img src={servicesCard3Image} alt="Design" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
               </div>
             </motion.div>
           </div>
        </div>
      </section>

      {/* Partnerships / Core Network Section */}
      <section className="bg-[#070b05] relative z-10 py-24 pb-32 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Text and Specs */}
              <div className="lg:col-span-5 space-y-8">
                 <motion.div
                   initial={{ opacity: 0, x: -24 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 >
                    <span className="text-[#D7FE03] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-[#D7FE03] animate-pulse"></span> {googleTag}
                    </span>
                 </motion.div>

                 <div className="space-y-6">
                    <motion.h2 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="font-sans text-3xl md:text-4xl lg:text-[46px] leading-[1.15] font-semibold text-zinc-100"
                    >
                      {googleTitle}
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      className="text-zinc-400 text-base md:text-lg leading-relaxed font-light"
                    >
                      {googleDescription}
                    </motion.p>
                 </div>

                 {/* Infrastructure Pillars */}
                 <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#D7FE03] mt-1 shrink-0 font-bold">1</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{googlePillar1Title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">{googlePillar1Desc}</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#D7FE03] mt-1 shrink-0 font-bold">2</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{googlePillar2Title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">{googlePillar2Desc}</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#D7FE03] mt-1 shrink-0 font-bold">3</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{googlePillar3Title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">{googlePillar3Desc}</p>
                      </div>
                    </motion.div>
                 </div>
              </div>

              {/* Right Column: Visual Core Network */}
              <div className="lg:col-span-7 flex flex-col items-center space-y-6">
                 <motion.div 
                   className="w-full max-w-[580px] sm:max-w-[620px] aspect-square bg-[#0b1007]/90 border border-zinc-800/80 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden flex items-center justify-center shadow-3xl shadow-black/80"
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 >
                    {/* Living Tech Grid Background - Styled in green instead of purple */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(215,254,3,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    
                    {/* SVG Interactive Network with scaled center 300, 300 */}
                    <svg viewBox="0 0 600 600" className="w-full h-full relative z-10 select-none">
                      <defs>
                        {/* Glow Filters strictly configured in green / white */}
                        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="glow-strong-green" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="9" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="glow-light-green" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Connection Wires from (300, 300) center */}
                      {networkNodes.map((node) => {
                        const pathD = getCurvePath(300, 300, node.x, node.y);
                        const isHovered = hoveredNetworkNode?.id === node.id;
                        return (
                          <g key={`wire-group-${node.id}`}>
                            {/* Base Wire - transitions from green to white on hover */}
                            <path 
                              d={pathD}
                              fill="none"
                              stroke={isHovered ? "#ffffff" : "rgba(151, 251, 46, 0.12)"}
                              strokeWidth={isHovered ? 2.5 : 1.2}
                              className="transition-all duration-300"
                            />
                            
                            {/* Animated Pulse traveling from center outward */}
                            <circle r={isHovered ? 5.5 : 3.5} fill={isHovered ? "#ffffff" : "#D7FE03"} filter="url(#glow-light-green)">
                              <animateMotion 
                                dur={isHovered ? "1.2s" : "2.4s"} 
                                repeatCount="indefinite" 
                                path={pathD} 
                                begin={`${node.id * 0.25}s`} 
                              />
                            </circle>
                          </g>
                        );
                      })}

                      {/* Core Center (Anima System Nucleus) - translated exactly to (255, 255) for 300, 300 perfect center alignment of 90x90 rect */}
                      <g transform="translate(255, 255)">
                        {/* Back Glow - glowing neon green */}
                        <circle 
                          cx="45" 
                          cy="45" 
                          r="60" 
                          fill="rgba(151, 251, 46, 0.08)" 
                          filter="url(#glow-strong-green)" 
                          className="animate-pulse"
                        />
                        
                        {/* Core rounded box */}
                        <rect 
                          x="0" 
                          y="0" 
                          width="90" 
                          height="90" 
                          rx="28" 
                          fill="#090d06" 
                          stroke={hoveredNetworkNode ? "#ffffff" : "#D7FE03"} 
                          strokeWidth="2" 
                          className="transition-all duration-500"
                          style={{ filter: 'drop-shadow(0px 0px 18px rgba(151, 251, 46, 0.45))' }}
                        />
                        
                        {/* Stacked cards representing Anima System dynamic framework */}
                        <g transform="translate(29, 26)" stroke={hoveredNetworkNode ? "#ffffff" : "#D7FE03"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-all duration-300">
                          <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="rgba(151, 251, 46, 0.08)" />
                          <path d="M2 14L16 21L30 14" />
                          <path d="M2 19L16 26L30 19" />
                        </g>

                        {/* Text under Anima logo */}
                        <text 
                          x="45" 
                          y="78" 
                          textAnchor="middle" 
                          fill="rgba(255, 255, 255, 0.5)" 
                          fontSize="7" 
                          fontFamily="monospace"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          {hoveredNetworkNode ? 'LINK ATIVO' : 'ANIMA CORE'}
                        </text>
                      </g>

                      {/* Client Nodes (Outer Rounded Square Nodes) */}
                      {networkNodes.map((node) => {
                        const isHovered = hoveredNetworkNode?.id === node.id;
                        return (
                          <g 
                            key={`node-${node.id}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredNetworkNode(node)}
                            onMouseLeave={() => setHoveredNetworkNode(null)}
                          >
                            {/* Outer glowing focus indicator ring */}
                            {isHovered && (
                              <circle 
                                cx={node.x} 
                                cy={node.y} 
                                r="28" 
                                fill="rgba(151, 251, 46, 0.08)"
                                filter="url(#glow-green)"
                              />
                            )}
                            
                            {/* Mini Client Rect */}
                            <rect 
                              x={node.x - 18} 
                              y={node.y - 18} 
                              width="36" 
                              height="36" 
                              rx="10" 
                              fill="#050804" 
                              stroke={isHovered ? "#ffffff" : "rgba(151, 251, 46, 0.4)"}
                              strokeWidth={isHovered ? 2 : 1.2}
                              className="transition-all duration-300"
                              style={isHovered ? { filter: 'drop-shadow(0px 0px 10px rgba(151, 251, 46, 0.5))' } : undefined}
                            />
                            
                            {/* Inner core dot */}
                            <circle 
                              cx={node.x} 
                              cy={node.y} 
                              r="4.5" 
                              fill={isHovered ? "#ffffff" : "#D7FE03"} 
                              className="transition-colors duration-300"
                              style={{ filter: isHovered ? 'drop-shadow(0px 0px 5px #ffffff)' : 'drop-shadow(0px 0px 4px #D7FE03)' }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                 </motion.div>

                 {/* HUD Status Overlay — Positioned BELOW the card to prevent overlap with bottom nodes */}
                 <div className="w-full max-w-[580px] sm:max-w-[620px] bg-[#090d07]/90 border border-zinc-850 rounded-2xl p-4.5 sm:p-5 backdrop-blur-md flex flex-col space-y-2 z-20 shadow-xl">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Status da Nuvem</span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> ONLINE
                       </span>
                    </div>
                    
                    <div className="transition-all duration-350 min-h-[46px] flex flex-col justify-center">
                       {hoveredNetworkNode ? (
                          <div className="space-y-1">
                             <div className="text-sm font-semibold text-zinc-100 flex items-center justify-between">
                               <span className="text-zinc-200">{hoveredNetworkNode.name}</span>
                               <span className="text-xs text-[#D7FE03] font-mono font-bold">{hoveredNetworkNode.status}</span>
                             </div>
                             <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                               <span>{hoveredNetworkNode.desc}</span>
                               <span className="text-zinc-400">Latência: {hoveredNetworkNode.latency} • CPU: {hoveredNetworkNode.cpu}</span>
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-1">
                             <div className="text-xs text-zinc-350 font-medium">
                               Monitorando <span className="text-[#D7FE03] font-semibold font-mono">8 Servidores Clientes</span> simultaneamente
                             </div>
                             <div className="text-[11px] text-zinc-500 font-mono">
                               Passe o mouse sobre os blocos para inspecionar os contêineres Google Cloud.
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* About Us section */}
      <section id="sobre" className="py-24 bg-[#f2f2f2] text-zinc-950 relative border-t border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div> {aboutTag}
              </span>
            </div>
            <h2 className="font-sans text-4xl md:text-5xl lg:text-[56px] font-medium leading-[1.1] text-zinc-900 mb-8 max-w-2xl">
              {aboutTitle}
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed max-w-xl mb-12 font-light">
              {aboutDescription}
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Saber Mais
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="rounded-[2rem] overflow-hidden text-white relative shadow-2xl h-[360px] border border-zinc-200"
          >
             <img src={aboutImage} alt="Sobre nós" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="bg-[#0a1007] relative z-10 py-32 border-t border-zinc-850">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="text-center max-w-2xl mx-auto mb-20"
           >
              <span className="text-[#D7FE03] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 mb-6">
                 <div className="w-1.5 h-1.5 bg-[#D7FE03] rounded-full"></div> {plansTag}
              </span>
              <h2 className="font-sans text-4xl md:text-5xl text-white font-medium leading-[1.1] mb-6">
                {plansTitle}
              </h2>
              <p className="text-white/60 text-lg font-light leading-relaxed">
                {plansDescription}
              </p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
              
              {/* Starter */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="bg-[#101112]/90 border border-zinc-800/60 rounded-[2rem] p-10 flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-300 relative"
              >
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">{plan1Name}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed min-h-[40px]">
                      {plan1Desc}
                    </p>
                  </div>
                  <div className="mb-8 font-sans font-extrabold text-4xl text-white tracking-tight">
                    {plan1Price}
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan1Features.split('\n').filter(Boolean).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#18191a] hover:bg-zinc-800 border border-zinc-850 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 mt-6 cursor-pointer"
                >
                  Iniciar Gratuitamente
                </motion.button>
              </motion.div>

              {/* Professional */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="bg-[#101112]/95 border-2 border-[#D7FE03] rounded-[2rem] p-10 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative shadow-[0_0_50px_rgba(215,254,3,0.1)]"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D7FE03] text-[#0a1007] text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg select-none">
                  Mais Popular
                </div>
                
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">{plan2Name}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed min-h-[40px]">
                      {plan2Desc}
                    </p>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-sans font-extrabold text-white tracking-tight">{plan2Price}</span>
                      {!plan2Price.includes('/') && <span className="text-zinc-500 text-xs font-semibold">/mês</span>}
                    </div>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan2Features.split('\n').filter(Boolean).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#c4e602] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(215,254,3,0.2)] mt-6 cursor-pointer"
                >
                  Assinar Pro
                </motion.button>
              </motion.div>

              {/* Enterprise */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="bg-[#101112]/90 border border-zinc-800/60 rounded-[2rem] p-10 flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-300 relative"
              >
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">{plan3Name}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed min-h-[40px]">
                      {plan3Desc}
                    </p>
                  </div>
                  <div className="mb-8 font-sans font-extrabold text-4xl text-white tracking-tight">
                    {plan3Price}
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan3Features.split('\n').filter(Boolean).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#18191a] hover:bg-zinc-800 border border-zinc-850 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 mt-6 cursor-pointer"
                >
                  Falar com Vendas
                </motion.button>
              </motion.div>

           </div>
        </div>
      </section>

      {/* FAQ Grid Section (Fades up nicely) */}
      <section className="py-24 bg-[#0a1007] relative z-10 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
             <h2 className="text-3xl font-bold text-white mb-4">{faqTitle}</h2>
             <p className="text-zinc-400 font-light">{faqSubtitle}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                question: faq1Question,
                answer: faq1Answer
              },
              {
                question: faq2Question,
                answer: faq2Answer
              },
              {
                question: faq3Question,
                answer: faq3Answer
              },
              {
                question: faq4Question,
                answer: faq4Answer
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between text-white font-medium hover:text-[#D7FE03] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-300", openFaq === idx && "rotate-180 text-[#D7FE03]")} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA Section matching design */}
      <footer className="bg-[#0c0d0e] relative z-10 border-t border-zinc-900 pt-16">
        
        {/* CTA Banner */}
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center relative overflow-hidden">
          {/* Neon green overlay blur glow to match the screenshot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#D7FE03]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-sans font-bold text-4xl md:text-5xl text-white tracking-tight max-w-2xl leading-tight mb-5 relative z-10">
            {footerCtaTitle}
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mb-10 relative z-10 font-light leading-relaxed">
            {footerCtaDesc}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(215,254,3,0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="relative z-10 bg-[#D7FE03] hover:bg-[#c4e602] text-black px-10 py-4 rounded-full font-bold text-xs tracking-wider transition-all shadow-[0_0_25px_rgba(215,254,3,0.3)] cursor-pointer"
          >
            {footerCtaButton}
          </motion.button>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="border-t border-zinc-900/80 max-w-7xl mx-auto px-6" />

        {/* Links Grid & Brand Info */}
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 md:gap-16 items-start">
          
          {/* Logo & Narrative */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <LightningLogo className="w-5 h-5 text-[#D7FE03]" />
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                {brandName}
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xs font-light">
              {footerBrandNarrative}
            </p>
          </div>

          {/* Links Column 1: Produto */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{footerColumn1Title}</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><a href="#servicos" className="hover:text-[#D7FE03] transition-colors">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-[#D7FE03] transition-colors">Integração Asaas</a></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Segurança</button></li>
              <li><a href="#planos" className="hover:text-[#D7FE03] transition-colors">Preços</a></li>
            </ul>
          </div>

          {/* Links Column 2: Recursos */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{footerColumn2Title}</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Documentação</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Status da API</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Central de Ajuda</button></li>
            </ul>
          </div>

          {/* Links Column 3: Empresa */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{footerColumn3Title}</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><a href="#sobre" className="hover:text-[#D7FE03] transition-colors">Sobre</a></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Termos de Serviço</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#D7FE03] transition-colors text-left cursor-pointer">Privacidade</button></li>
            </ul>
          </div>

        </div>

        {/* Divider 2 */}
        <div className="border-t border-zinc-900/60" />

        {/* Copyright and Health Status Row */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs text-center sm:text-left font-light">
            {footerCopyright}
          </p>
          
          {/* Status Badge from Mockup */}
          <div className="flex items-center gap-2 border border-emerald-900/30 bg-[#061c0e]/40 px-4 py-1.5 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[11px] font-medium tracking-wide">
              {footerStatusText}
            </span>
          </div>
        </div>

      </footer>

      {/* Login & CPF Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={cn(
                "bg-zinc-950 border border-zinc-800/80 rounded-[2rem] w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative transition-all duration-300",
                authMode === 'login' ? "max-w-4xl" : "max-w-lg"
              )}
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setAuthError('');
                  setAuthMode('login');
                }}
                className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors p-2 z-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {authMode === 'login' ? (
                /* TWO COLUMN LOGIN MODAL */
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                  
                  {/* Left Column: Form */}
                  <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <LightningLogo className="w-5 h-5 text-[#D7FE03]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#D7FE03]">Portal do Cliente</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Fazer Login</h2>
                      <p className="text-zinc-500 text-xs mt-1">Acesse sua área exclusiva para acompanhar o status e evolução do seu projeto.</p>
                    </div>

                    {authError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-light">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <form onSubmit={handleClientLogin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">E-mail corporativo</label>
                        <input 
                          type="email" 
                          required 
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                          placeholder="seu@email.com"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Senha de acesso</label>
                        </div>
                        <input 
                          type="password" 
                          required 
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                          placeholder="Sua senha secreta"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-[#D7FE03] hover:bg-[#c4e602] disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(215,254,3,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {authLoading ? 'Autenticando...' : 'Entrar no Sistema'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
 
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-zinc-800/80"></div>
                      <span className="flex-shrink mx-4 text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Ou administradores</span>
                      <div className="flex-grow border-t border-zinc-800/80"></div>
                    </div>
 
                    <button 
                      onClick={handleCollaboratorLogin}
                      disabled={authLoading}
                      className="w-full bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-white font-medium py-3 rounded-xl text-xs tracking-wide flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                    >
                      Acessar como administrador
                    </button>
                  </div>

                  {/* Right Column: Register CTA */}
                  <div className="md:col-span-5 bg-gradient-to-br from-[#0c1c05] to-[#040902] border-l border-zinc-800/50 p-8 md:p-10 flex flex-col justify-between text-[#f4fbf0] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D7FE03]/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10 my-auto">
                      <div className="w-10 h-10 rounded-xl bg-[#D7FE03]/10 border border-[#D7FE03]/20 flex items-center justify-center text-[#D7FE03] mb-4">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Primeiro acesso por aqui?</h3>
                      <p className="text-zinc-400 text-xs leading-relaxed font-light">
                        Se você contratou um sistema com a AnimaSystem, use o seu CPF para registrar sua senha e ativar o acompanhamento integrado de SLAs, chamados e monitoramento NOC.
                      </p>
                      
                      <button 
                        onClick={() => {
                          setAuthError('');
                          setAuthMode('register_step1');
                        }}
                        className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D7FE03] font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Ativar Conta com CPF <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[10px] text-zinc-600 font-light mt-4">
                      Problemas com acesso? Entre em contato com seu gestor de projetos.
                    </div>
                  </div>

                </div>
              ) : authMode === 'register_step1' ? (
                /* REGISTRATION STEP 1: CPF & CAPTCHA */
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-[#D7FE03]" />
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D7FE03]">Etapa 1 de 2</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Identificar seu CPF</h2>
                    <p className="text-zinc-500 text-xs mt-1">Insira seu CPF de cadastro para buscar seus dados automaticamente no banco.</p>
                  </div>

                  {authError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-light">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCpfCheck} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">CPF do Titular</label>
                      <input 
                        type="text" 
                        required 
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#D7FE03] hover:bg-[#c4e602] disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(215,254,3,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {authLoading ? 'Verificando...' : 'Buscar Cadastro'} <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setAuthMode('login');
                      }}
                      className="w-full bg-transparent text-zinc-400 hover:text-white py-1 text-xs transition-colors text-center block cursor-pointer"
                    >
                      Voltar para o Login
                    </button>
                  </form>
                </div>
              ) : authMode === 'register_step2' ? (
                /* REGISTRATION STEP 2: PASSWORD SETTINGS */
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D7FE03]" />
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D7FE03]">Etapa 2 de 2</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Concluir seu Acesso</h2>
                    <p className="text-zinc-500 text-xs mt-1">
                      Projeto encontrado: <strong className="text-white font-medium">{matchedClient?.name}</strong>. Defina suas credenciais de acesso abaixo.
                    </p>
                  </div>

                  {authError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-light">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCompleteRegistration} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">E-mail corporativo</label>
                      <input 
                        type="email" 
                        required 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Defina sua Senha</label>
                      <input 
                        type="password" 
                        required 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                        placeholder="Mínimo de 6 caracteres"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Confirmar Senha</label>
                      <input 
                        type="password" 
                        required 
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                        placeholder="Digite a senha novamente"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#D7FE03] hover:bg-[#c4e602] disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(215,254,3,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {authLoading ? 'Registrando...' : 'Criar minha Conta'} <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setAuthMode('register_step1');
                      }}
                      className="w-full bg-transparent text-zinc-400 hover:text-white py-1 text-xs transition-colors text-center block cursor-pointer"
                    >
                      Voltar para Etapa anterior
                    </button>
                  </form>
                </div>
              ) : authMode === 'success' ? (
                /* SUCCESS STATE: Animated smile careta & Welcome message */
                <div className="p-10 flex flex-col items-center text-center justify-center min-h-[420px] space-y-6">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                    className="flex items-center justify-center"
                  >
                    <svg 
                      viewBox="0 0 100 100" 
                      className="w-36 h-36 text-[#D7FE03]"
                      style={{ filter: "drop-shadow(0 0 20px rgba(151, 251, 46, 0.8))" }}
                    >
                      {/* Eyes: two parallel vertical rounded thick lines */}
                      <rect x="34" y="22" width="8" height="32" rx="4" fill="currentColor" />
                      <rect x="58" y="22" width="8" height="32" rx="4" fill="currentColor" />
                      {/* Smile: curved stroke */}
                      <path d="M 22 58 Q 50 82 78 58" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight font-sans">
                      Bem vindo, {currentUserName}!
                    </h2>
                    <p className="text-[#D7FE03] text-xs font-semibold uppercase tracking-widest animate-pulse">
                      Autenticação realizada com sucesso
                    </p>
                    <p className="text-zinc-500 text-xs font-light max-w-xs mx-auto">
                      Estamos direcionando você para o seu painel de controle. Aguarde um instante...
                    </p>
                  </div>
                </div>
              ) : (
                /* REGISTRATION STEP 3: NEW CLIENT REGISTRATION FORM (register_new_client) */
                <div className="p-8 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3.5 h-3.5 text-[#D7FE03]" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#D7FE03]">Acesso Exclusivo</span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Bem vindo!</h2>
                    <p className="text-zinc-500 text-[11px] mt-0.5 leading-relaxed">
                      Preencha seus dados cadastrais para ativar instantaneamente sua conta.
                    </p>
                  </div>

                  {/* Tabs Selector */}
                  <div className="flex gap-1.5 p-1 bg-zinc-950 border border-zinc-900/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveRegTab('personal')}
                      className={cn(
                        "flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        activeRegTab === 'personal'
                          ? "bg-zinc-900 text-white border border-zinc-800/40"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Dados do Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRegTab('company')}
                      className={cn(
                        "flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        activeRegTab === 'company'
                          ? "bg-zinc-900 text-white border border-zinc-800/40"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <Server className="w-3.5 h-3.5" />
                      Dados da Empresa
                    </button>
                  </div>

                  {authError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-light">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateNewClient} className="space-y-4">
                    {/* Scrollable Container to fit all fields perfectly without clipping */}
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
                      
                      {activeRegTab === 'personal' ? (
                        /* PERSONAL CLIENT DATA FIELDS */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Nome *</label>
                              <input 
                                type="text" 
                                required 
                                value={clientFirstName}
                                onChange={(e) => setClientFirstName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                                placeholder="Seu nome"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Sobrenome *</label>
                              <input 
                                type="text" 
                                required 
                                value={clientLastName}
                                onChange={(e) => setClientLastName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                                placeholder="Seu sobrenome"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">CPF (Confirmado)</label>
                              <input 
                                type="text" 
                                disabled
                                value={regCpf}
                                className="w-full bg-zinc-900/40 border border-zinc-900/20 rounded-xl px-3.5 py-2 text-xs text-zinc-500 cursor-not-allowed font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Telefone *</label>
                              <input 
                                type="text" 
                                required
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">E-mail *</label>
                            <input 
                              type="email" 
                              required 
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                              placeholder="seu@email.com"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Senha de Acesso *</label>
                              <input 
                                type="password" 
                                required 
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="Mínimo 6 caracteres"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Confirmar Senha *</label>
                              <input 
                                type="password" 
                                required 
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="Confirmar senha"
                              />
                            </div>
                          </div>

                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveRegTab('company')}
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-2 rounded-xl text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              Dados da Empresa (Opcional) <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* OPTIONAL COMPANY FIELDS */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Razão Social</label>
                              <input 
                                type="text" 
                                value={companyRazaoSocial}
                                onChange={(e) => setCompanyRazaoSocial(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                                placeholder="Razão social da empresa"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">CNPJ</label>
                              <input 
                                type="text" 
                                value={companyCnpj}
                                onChange={(e) => setCompanyCnpj(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-mono"
                                placeholder="00.000.000/0000-00"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Inscrição Estadual</label>
                              <input 
                                type="text" 
                                value={companyInscricaoEstadual}
                                onChange={(e) => setCompanyInscricaoEstadual(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                                placeholder="Inscrição estadual"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Horário de Funcionamento</label>
                              <input 
                                type="text" 
                                value={companyWorkingHours}
                                onChange={(e) => setCompanyWorkingHours(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                                placeholder="Ex: Seg a Sex 8h às 18h"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Endereço COMPLETO com CEP</label>
                            <input 
                              type="text" 
                              value={companyAddress}
                              onChange={(e) => setCompanyAddress(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all"
                              placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Email da Empresa</label>
                              <input 
                                type="email" 
                                value={companyEmail}
                                onChange={(e) => setCompanyEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="empresa@email.com"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Telefone da Empresa</label>
                              <input 
                                type="text" 
                                value={companyPhone}
                                onChange={(e) => setCompanyPhone(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="(00) 0000-0000"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Web Site</label>
                              <input 
                                type="text" 
                                value={companyWebsite}
                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="www.site.com"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Instagram</label>
                              <input 
                                type="text" 
                                value={companyInstagram}
                                onChange={(e) => setCompanyInstagram(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="@perfil"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">YouTube</label>
                              <input 
                                type="text" 
                                value={companyYoutube}
                                onChange={(e) => setCompanyYoutube(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="Link do YouTube"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Facebook</label>
                              <input 
                                type="text" 
                                value={companyFacebook}
                                onChange={(e) => setCompanyFacebook(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="facebook.com/empresa"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">LinkedIn</label>
                              <input 
                                type="text" 
                                value={companyLinkedin}
                                onChange={(e) => setCompanyLinkedin(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="linkedin.com/in"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Pinterest</label>
                              <input 
                                type="text" 
                                value={companyPinterest}
                                onChange={(e) => setCompanyPinterest(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="pinterest.com/usuario"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">TikTok</label>
                              <input 
                                type="text" 
                                value={companyTiktok}
                                onChange={(e) => setCompanyTiktok(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D7FE03] focus:ring-1 focus:ring-[#D7FE03] transition-all font-light"
                                placeholder="@tiktok"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => setActiveRegTab('personal')}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold py-2 rounded-xl text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                Voltar para Dados do Cliente
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="pt-3.5 border-t border-zinc-900">
                      <button 
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-[#D7FE03] hover:bg-[#c4e602] disabled:opacity-50 text-black font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(215,254,3,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? 'Registrando...' : 'Criar meu Cadastro'} <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setAuthError('');
                          setAuthMode('register_step1');
                        }}
                        className="w-full bg-transparent text-zinc-500 hover:text-zinc-300 py-2 text-xs transition-colors text-center block cursor-pointer mt-1"
                      >
                        Voltar para Etapa de CPF
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
