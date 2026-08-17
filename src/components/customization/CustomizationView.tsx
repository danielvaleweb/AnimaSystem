import { useState, useEffect, useRef } from 'react';
import { 
  Palette, Image as ImageIcon, Upload, Link as LinkIcon, Loader2,
  Sparkles, RefreshCw, Type, Save, CheckCircle2, AlertTriangle, Monitor,
  Plus, Trash2, Sliders, Layers, HelpCircle, CreditCard, Layout, Info, Server
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useNotification } from '../NotificationContext';

interface CustomLogoItem {
  id: string;
  name: string;
  logoUrl?: string;
  logoInitials?: string;
}

export function CustomizationView() {
  const { showSuccess, showError } = useNotification();
  const [brandName, setBrandName] = useState('AnimaSystem');
  const [heroTitle, setHeroTitle] = useState('Criação inteligente. \n Estratégia real. \n Na palma da sua mão.');
  const [heroDescription, setHeroDescription] = useState('Ajudamos empresas e marcas a estruturar completamente a sua presença online. Da validação da ideia até sistemas escaláveis e apps interativos.');
  const [heroImage, setHeroImage] = useState('');
  
  // Custom banners states
  const [banner1Url, setBanner1Url] = useState('');
  const [banner2Url, setBanner2Url] = useState('');
  const [banner3Url, setBanner3Url] = useState('');
  const [isBanner1Uploading, setIsBanner1Uploading] = useState(false);
  const [isBanner2Uploading, setIsBanner2Uploading] = useState(false);
  const [isBanner3Uploading, setIsBanner3Uploading] = useState(false);
  
  // Dashboard internal banners
  const [dashboardBanner1Url, setDashboardBanner1Url] = useState('');
  const [dashboardBanner2Url, setDashboardBanner2Url] = useState('');
  const [dashboardBanner3Url, setDashboardBanner3Url] = useState('');
  const [isDashboardBanner1Uploading, setIsDashboardBanner1Uploading] = useState(false);
  const [isDashboardBanner2Uploading, setIsDashboardBanner2Uploading] = useState(false);
  const [isDashboardBanner3Uploading, setIsDashboardBanner3Uploading] = useState(false);
  const dashboardBanner1FileInputRef = useRef<HTMLInputElement>(null);
  const dashboardBanner2FileInputRef = useRef<HTMLInputElement>(null);
  const dashboardBanner3FileInputRef = useRef<HTMLInputElement>(null);

  // Logo Loop states
  const [marqueeMode, setMarqueeMode] = useState<'auto' | 'manual'>('auto');
  const [customMarqueeItems, setCustomMarqueeItems] = useState<CustomLogoItem[]>([]);
  
  // New State variables for customizable Landing Page sections:
  
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
  
  // 2. Núcleo Google
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

  // 5. Perguntas Frequentes (FAQ)
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

  // 6. Rodapé (Footer)
  const [footerCtaTitle, setFooterCtaTitle] = useState("Pronto para tomar o controle?");
  const [footerCtaDesc, setFooterCtaDesc] = useState("Centralize hoje mesmo a operação dos seus softwares. Sem planilhas, sem dezenas de abas soltas.");
  const [footerCtaButton, setFooterCtaButton] = useState("Acessar Portal do Cliente");
  const [footerBrandNarrative, setFooterBrandNarrative] = useState("O sistema ERP e Monitoramento focado na redução de atrito para agências digitais e criadores de Software.");
  const [footerColumn1Title, setFooterColumn1Title] = useState("Produto");
  const [footerColumn2Title, setFooterColumn2Title] = useState("Recursos");
  const [footerColumn3Title, setFooterColumn3Title] = useState("Empresa");
  const [footerCopyright, setFooterCopyright] = useState("© 2026 AnimaSystem Inc. Todos os direitos reservados.");
  const [footerStatusText, setFooterStatusText] = useState("Todos os Serviços Online (Status: Verde)");

  // Temp item states for adding new logo
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [isAddingLogo, setIsAddingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'banner' | 'carousel' | 'dashboard' | 'services' | 'google' | 'about' | 'plans' | 'faq' | 'footer'>('text');

  // Upload indicators
  const [isUploading, setIsUploading] = useState(false);
  const [isMarqueeUploading, setIsMarqueeUploading] = useState(false);
  const [isService1Uploading, setIsService1Uploading] = useState(false);
  const [isService2Uploading, setIsService2Uploading] = useState(false);
  const [isService3Uploading, setIsService3Uploading] = useState(false);
  const [isAboutUploading, setIsAboutUploading] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const banner1FileInputRef = useRef<HTMLInputElement>(null);
  const banner2FileInputRef = useRef<HTMLInputElement>(null);
  const banner3FileInputRef = useRef<HTMLInputElement>(null);
  const marqueeFileInputRef = useRef<HTMLInputElement>(null);
  const service1FileInputRef = useRef<HTMLInputElement>(null);
  const service2FileInputRef = useRef<HTMLInputElement>(null);
  const service3FileInputRef = useRef<HTMLInputElement>(null);
  const aboutFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.brandName) setBrandName(data.brandName);
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroDescription) setHeroDescription(data.heroDescription);
          if (data.heroImage) setHeroImage(data.heroImage);
          if (data.banner1Url) setBanner1Url(data.banner1Url);
          if (data.banner2Url) setBanner2Url(data.banner2Url);
          if (data.banner3Url) setBanner3Url(data.banner3Url);
          if (data.dashboardBanner1Url) setDashboardBanner1Url(data.dashboardBanner1Url);
          if (data.dashboardBanner2Url) setDashboardBanner2Url(data.dashboardBanner2Url);
          if (data.dashboardBanner3Url) setDashboardBanner3Url(data.dashboardBanner3Url);
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

          // 6. Footer / Rodapé
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
      } catch (error) {
        console.error("Error loading customization settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Generic upload logic helper to prevent redundant handlers
  const uploadImage = (
    file: File, 
    setter: (url: string) => void, 
    setLoading: (loading: boolean) => void,
    sectionName: string
  ) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, `branding/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error("Upload error", error);
          showError("Falha no upload", `Não foi possível carregar a imagem para ${sectionName}.`);
          setLoading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setter(downloadUrl);
          setLoading(false);
          showSuccess("Upload concluído", `A imagem de ${sectionName} foi enviada. Salve para persistir.`);
        }
      );
    } catch (error) {
      console.error(error);
      showError("Erro inesperado", "Ocorreu um erro ao processar o upload.");
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setHeroImage, setIsUploading, "Hero Banner");
  };

  const handleMarqueeLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setNewLogoUrl, setIsMarqueeUploading, "Logo Carrossel");
  };

  const handleService1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setServicesCard1Image, setIsService1Uploading, "Serviço 1");
  };

  const handleService2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setServicesCard2Image, setIsService2Uploading, "Serviço 2");
  };

  const handleService3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setServicesCard3Image, setIsService3Uploading, "Serviço 3");
  };

  const handleAboutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setAboutImage, setIsAboutUploading, "Sobre Nós");
  };

  const handleBanner1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setBanner1Url, setIsBanner1Uploading, "Banner Pequeno 1");
  };

  const handleBanner2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setBanner2Url, setIsBanner2Uploading, "Banner Pequeno 2");
  };

  const handleBanner3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, setBanner3Url, setIsBanner3Uploading, "Banner Pequeno 3");
  };

  const handleAddCustomLogo = () => {
    if (!newLogoName.trim()) {
      showError("Nome necessário", "Por favor, preencha o nome do cliente.");
      return;
    }
    const initials = newLogoName.trim().substring(0, 2).toUpperCase();
    const newItem: CustomLogoItem = {
      id: Date.now().toString(),
      name: newLogoName.trim(),
      logoUrl: newLogoUrl.trim() || undefined,
      logoInitials: initials
    };
    setCustomMarqueeItems(prev => [...prev, newItem]);
    setNewLogoName('');
    setNewLogoUrl('');
    setIsAddingLogo(false);
    showSuccess("Item adicionado", "O cliente foi inserido na lista temporária. Clique em Salvar para gravar.");
  };

  const handleRemoveCustomLogo = (id: string) => {
    setCustomMarqueeItems(prev => prev.filter(item => item.id !== id));
  };

  // Synchronize simulator scroll position with the currently active editing tab
  useEffect(() => {
    const container = document.getElementById('simulator-scroll-container');
    if (!container) return;

    const sectionMap: Record<string, string> = {
      text: 'sim-hero',
      banner: 'sim-hero',
      carousel: 'sim-marquee',
      services: 'sim-services',
      google: 'sim-google',
      about: 'sim-about',
      plans: 'sim-plans',
      faq: 'sim-faq',
      footer: 'sim-footer'
    };

    const targetId = sectionMap[activeTab];
    if (targetId) {
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Calculate dynamic scroll target relative to parent container
        const containerRect = container.getBoundingClientRect();
        const elementRect = targetEl.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        
        container.scrollTo({
          top: relativeTop - 12,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, { 
        brandName, 
        heroTitle, 
        heroDescription, 
        heroImage,
        banner1Url,
        banner2Url,
        banner3Url,
        dashboardBanner1Url,
        dashboardBanner2Url,
        dashboardBanner3Url,
        marqueeMode,
        customMarqueeItems,

        // 1. Serviços
        servicesTag,
        servicesCard1Category,
        servicesCard1Title,
        servicesCard1Image,
        servicesCard2Category,
        servicesCard2Title,
        servicesCard2Image,
        servicesCard3Category,
        servicesCard3Title,
        servicesCard3Image,

        // 2. Google Cloud Core
        googleTag,
        googleTitle,
        googleDescription,
        googlePillar1Title,
        googlePillar1Desc,
        googlePillar2Title,
        googlePillar2Desc,
        googlePillar3Title,
        googlePillar3Desc,

        // 3. Sobre Nós
        aboutTag,
        aboutTitle,
        aboutDescription,
        aboutImage,

        // 4. Planos
        plansTag,
        plansTitle,
        plansDescription,
        plan1Name,
        plan1Desc,
        plan1Price,
        plan1Features,
        plan2Name,
        plan2Desc,
        plan2Price,
        plan2Features,
        plan3Name,
        plan3Desc,
        plan3Price,
        plan3Features,

        // 5. FAQ
        faqTitle,
        faqSubtitle,
        faq1Question,
        faq1Answer,
        faq2Question,
        faq2Answer,
        faq3Question,
        faq3Answer,
        faq4Question,
        faq4Answer,

        // 6. Footer / Rodapé
        footerCtaTitle,
        footerCtaDesc,
        footerCtaButton,
        footerBrandNarrative,
        footerColumn1Title,
        footerColumn2Title,
        footerColumn3Title,
        footerCopyright,
        footerStatusText
      }, { merge: true });
      showSuccess("Personalização salva", "Todas as configurações globais de conteúdo da Landing Page foram atualizadas.");
    } catch (error) {
      console.error("Error saving customization settings:", error);
      showError("Falha de gravação", "Não foi possível gravar as novas configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const renderSimulator = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-accent animate-pulse" /> Simulador Ativo
          </h4>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-accent font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FE03] animate-ping"></span> LIVE SYNC
          </span>
        </div>
        
        <p className="text-zinc-500 text-[11px] leading-relaxed">
          Navegue abaixo para visualizar o design completo da homepage atualizado em tempo real.
        </p>

        {/* Smartphone Frame Container */}
        <div className="border border-zinc-200/80 rounded-2xl bg-[#050804] overflow-hidden shadow-sm flex flex-col text-left relative">
          
          {/* Simulated Mobile Status bar */}
          <div className="bg-[#050804] px-4 py-2 flex items-center justify-between border-b border-zinc-200/60 text-zinc-500 text-[8px] font-mono">
            <div className="flex items-center gap-1">
              <span>09:17</span>
            </div>
            <div className="w-16 h-3.5 bg-black rounded-full border border-zinc-200 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-100"></span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px]">5G</span>
              <div className="w-2.5 h-1.5 border border-zinc-500 rounded-sm p-px flex">
                <div className="bg-zinc-500 w-full h-full rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Fake Browser Address bar */}
          <div className="bg-white/40 px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-200/80">
            <span className="w-2 h-2 rounded-full bg-zinc-100/80 block"></span>
            <span className="w-2 h-2 rounded-full bg-zinc-100/80 block"></span>
            <span className="text-[9px] text-zinc-500 bg-white px-4 py-0.5 rounded-md ml-3 flex-1 text-center truncate font-mono">
              anima-system.com.br
            </span>
          </div>

          {/* Simulated Sticky Navbar */}
          <div className="sticky top-0 z-20 bg-[#050804]/90 backdrop-blur-md border-b border-zinc-200/80 px-3.5 py-2.5 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1 font-extrabold text-black tracking-tight">
              <span className="text-[#D7FE03]">✦</span>
              <span>{brandName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-[#D7FE03] font-bold bg-[#D7FE03]/10 px-1.5 py-0.5 rounded border border-[#D7FE03]/25">Portal</span>
              <span className="w-3.5 h-2.5 flex flex-col justify-between cursor-pointer py-0.5">
                <span className="h-px bg-zinc-400 w-full block rounded-full"></span>
                <span className="h-px bg-zinc-400 w-2/3 block self-end rounded-full"></span>
              </span>
            </div>
          </div>

          {/* Scrollable Viewport (Representing the full dynamic Homepage) */}
          <div 
            id="simulator-scroll-container" 
            className="h-[480px] overflow-y-auto scroll-smooth custom-scrollbar-none bg-[#050804]"
          >
            
            {/* 1. HERO SECTION */}
            <div 
              id="sim-hero" 
              className={`p-4 pt-6 space-y-3 relative overflow-hidden border-b border-zinc-200 transition-colors duration-500 ${
                activeTab === 'text' || activeTab === 'banner' ? 'bg-white/20' : 'bg-[#050804]'
              }`}
            >
              {/* Decorative radial blur gradient */}
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#D7FE03]/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <span className="inline-block px-1.5 py-0.5 bg-white/80 border border-zinc-850 text-[#D7FE03] text-[7px] font-extrabold uppercase tracking-widest rounded-md">
                PLATAFORMA NOC
              </span>
              
              <h1 className="text-black text-[13px] font-black tracking-tight leading-snug whitespace-pre-line">
                {heroTitle || 'Criação inteligente.\nEstratégia real.'}
              </h1>
              
              <p className="text-zinc-500 text-[9px] leading-relaxed font-light">
                {heroDescription || 'Centralize o monitoramento dos seus microsaas e gerencie de forma automatizada com faturamento ativo.'}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex gap-1.5 pt-1">
                <span className="px-3 py-1.5 bg-[#D7FE03] text-black text-[8px] font-black rounded-full shadow-md">
                  Acessar Portal
                </span>
                <span className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-[8px] font-bold rounded-full">
                  Nossos Planos
                </span>
              </div>

              {/* Dynamic Hero Image */}
              {heroImage ? (
                <div className="pt-2">
                  <div className="relative h-20 w-full rounded-xl overflow-hidden border border-zinc-200">
                    <img src={heroImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="relative h-14 w-full rounded-xl overflow-hidden border border-dashed border-zinc-850 bg-white/40 flex items-center justify-center text-[7.5px] text-zinc-600 font-mono">
                    [Imagem do Header desativada]
                  </div>
                </div>
              )}
            </div>

            {/* 2. CONTINUOUS LOGO MARQUEE */}
            <div 
              id="sim-marquee" 
              className={`bg-[#080d05] border-y border-zinc-200/60 py-3 px-3 overflow-hidden transition-colors duration-500 ${
                activeTab === 'carousel' ? 'bg-[#152a0a]' : 'bg-[#080d05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[6.5px] text-zinc-500 uppercase tracking-widest font-extrabold block">
                  Loop de Logos (Carrossel)
                </span>
                <span className="text-[5.5px] font-mono text-zinc-500 bg-white px-1 rounded">
                  Modo: {marqueeMode === 'auto' ? 'AUTO' : 'MANUAL'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-hidden opacity-80 select-none py-0.5">
                {marqueeMode === 'auto' ? (
                  ['Sheiffer', 'E-commerce Sol', 'Premium CRM', 'Checkout'].map((name, idx) => (
                    <span key={idx} className="text-black/60 text-[7.5px] font-bold whitespace-nowrap bg-white px-2 py-0.5 rounded border border-zinc-200">
                      ✦ {name}
                    </span>
                  ))
                ) : customMarqueeItems.length > 0 ? (
                  customMarqueeItems.map((item) => (
                    <span key={item.id} className="text-black/60 text-[7.5px] font-bold whitespace-nowrap bg-white px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                      {item.logoUrl ? (
                        <img src={item.logoUrl} className="w-2.5 h-2.5 object-contain" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[6px] text-accent font-mono">{item.logoInitials || '✦'}</span>
                      )}
                      {item.name}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-600 text-[7.5px] italic font-mono">[Nenhum item manual cadastrado]</span>
                )}
              </div>
            </div>

            {/* 3. SERVICES SECTION */}
            <div 
              id="sim-services" 
              className={`p-4 bg-white border-b border-zinc-200 space-y-3.5 transition-colors duration-500 ${
                activeTab === 'services' ? 'bg-[#0f1a07]' : 'bg-white'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[7px] text-[#D7FE03] font-black uppercase tracking-widest block">
                  {servicesTag || 'SERVIÇOS'}
                </span>
                <h2 className="text-black text-[11px] font-bold tracking-tight">
                  Serviços Especializados
                </h2>
                <p className="text-zinc-500 text-[7.5px] leading-relaxed">
                  Soluções inteligentes focadas em alta conversão e infraestrutura.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5">
                {/* Service 1 */}
                <div className="p-2 bg-white/60 border border-zinc-850 rounded-xl space-y-1.5">
                  {servicesCard1Image && (
                    <img src={servicesCard1Image} className="w-full h-12 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <span className="text-[5.5px] text-[#D7FE03] uppercase tracking-widest font-extrabold block">
                      {servicesCard1Category || 'INFRAESTRUTURA'}
                    </span>
                    <h4 className="text-black text-[8px] font-extrabold truncate">{servicesCard1Title || 'Card 1'}</h4>
                  </div>
                </div>

                {/* Service 2 */}
                <div className="p-2 bg-white/60 border border-zinc-850 rounded-xl space-y-1.5">
                  {servicesCard2Image && (
                    <img src={servicesCard2Image} className="w-full h-12 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <span className="text-[5.5px] text-[#D7FE03] uppercase tracking-widest font-extrabold block">
                      {servicesCard2Category || 'INTEGRAÇÕES'}
                    </span>
                    <h4 className="text-black text-[8px] font-extrabold truncate">{servicesCard2Title || 'Card 2'}</h4>
                  </div>
                </div>

                {/* Service 3 */}
                <div className="p-2 bg-white/60 border border-zinc-850 rounded-xl space-y-1.5">
                  {servicesCard3Image && (
                    <img src={servicesCard3Image} className="w-full h-12 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <span className="text-[5.5px] text-[#D7FE03] uppercase tracking-widest font-extrabold block">
                      {servicesCard3Category || 'FATIVIDADE'}
                    </span>
                    <h4 className="text-black text-[8px] font-extrabold truncate">{servicesCard3Title || 'Card 3'}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. GOOGLE CLOUD INTEGRATION SECTION */}
            <div 
              id="sim-google" 
              className={`p-4 bg-[#050804] border-b border-zinc-200 space-y-3 transition-colors duration-500 ${
                activeTab === 'google' ? 'bg-[#152a0a]' : 'bg-[#050804]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[7px] text-[#D7FE03] font-black uppercase tracking-widest block">
                  {googleTag || 'GOOGLE CLOUD CORE'}
                </span>
                <h2 className="text-black text-[11px] font-bold leading-tight">
                  {googleTitle || 'Infraestrutura Crítica'}
                </h2>
              </div>

              <p className="text-zinc-500 text-[8px] leading-relaxed">
                {googleDescription || 'Nossos clusters rodam sob as mesmas diretrizes globais do Google Cloud.'}
              </p>

              {/* Dynamic Pillars */}
              <div className="space-y-1.5 pt-1">
                <div className="p-2 bg-white/50 rounded-xl border border-zinc-850/80">
                  <span className="text-[7.5px] font-extrabold text-black block">✦ {googlePillar1Title || 'Hospedagem Dedicada'}</span>
                  <span className="text-[6.5px] text-zinc-500 block leading-tight">{googlePillar1Desc || 'Sistemas isolados para máxima performance.'}</span>
                </div>
                <div className="p-2 bg-white/50 rounded-xl border border-zinc-850/80">
                  <span className="text-[7.5px] font-extrabold text-black block">✦ {googlePillar2Title || 'Auto-Scaling'}</span>
                  <span className="text-[6.5px] text-zinc-500 block leading-tight">{googlePillar2Desc || 'Suporta picos de faturamento sem lentidão.'}</span>
                </div>
                <div className="p-2 bg-white/50 rounded-xl border border-zinc-850/80">
                  <span className="text-[7.5px] font-extrabold text-black block">✦ {googlePillar3Title || 'Redundância'}</span>
                  <span className="text-[6.5px] text-zinc-500 block leading-tight">{googlePillar3Desc || 'Backup em tempo real multi-regiões.'}</span>
                </div>
              </div>
            </div>

            {/* 5. ABOUT US SECTION */}
            <div 
              id="sim-about" 
              className={`p-4 bg-[#f4f4f4] text-zinc-950 border-b border-zinc-200 space-y-3 transition-colors duration-500 ${
                activeTab === 'about' ? 'bg-zinc-200' : 'bg-[#f4f4f4]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest block">
                  {aboutTag || 'SOBRE NÓS'}
                </span>
                <h2 className="text-zinc-900 text-[11px] font-black leading-tight">
                  {aboutTitle || 'Transformando a operação de softwares institucionais.'}
                </h2>
              </div>

              <p className="text-zinc-600 text-[8px] leading-relaxed font-light font-sans">{aboutDescription}</p>

              {aboutImage ? (
                <div className="rounded-xl overflow-hidden h-20 w-full border border-zinc-300 shadow-sm">
                  <img src={aboutImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : null}
            </div>

            {/* 6. PRICING PLANS SECTION */}
            <div 
              id="sim-plans" 
              className={`p-4 bg-[#0a1007] border-b border-zinc-200 space-y-3.5 transition-colors duration-500 ${
                activeTab === 'plans' ? 'bg-[#152a0a]' : 'bg-[#0a1007]'
              }`}
            >
              <div className="text-center space-y-0.5">
                <span className="text-[7px] text-[#D7FE03] font-black uppercase tracking-widest block">
                  {plansTag || 'TABELA DE PREÇOS'}
                </span>
                <h2 className="text-black text-[11px] font-bold">
                  {plansTitle || 'Planos sob Medida'}
                </h2>
                <p className="text-zinc-500 text-[7.5px] max-w-[85%] mx-auto font-sans leading-relaxed">
                  {plansDescription}
                </p>
              </div>

              {/* Three Mini Cards */}
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* Plan 1 */}
                <div className="p-2 bg-white/60 border border-zinc-850 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[7.5px] font-extrabold text-black block">{plan1Name || 'Starter'}</span>
                    <p className="text-[6.5px] text-zinc-500 line-clamp-1">{plan1Desc || 'Para pequenos criadores.'}</p>
                    <span className="text-[10px] font-black text-[#D7FE03] mt-1 block">{plan1Price || 'Grátis'}</span>
                  </div>
                  <div className="h-px bg-zinc-100/80 my-1.5" />
                  <p className="text-[6px] text-zinc-500 font-mono whitespace-pre-line leading-relaxed">{plan1Features}</p>
                </div>

                {/* Plan 2 - Highlighted */}
                <div className="p-2 bg-white border border-[#D7FE03]/40 rounded-xl flex flex-col justify-between relative shadow-md">
                  <span className="absolute top-1 right-2 bg-[#D7FE03] text-black text-[5px] font-extrabold uppercase px-1 rounded">DESTAQUE</span>
                  <div>
                    <span className="text-[7.5px] font-extrabold text-black block">{plan2Name || 'Professional'}</span>
                    <p className="text-[6.5px] text-zinc-500 line-clamp-1">{plan2Desc || 'Para agências em expansão.'}</p>
                    <span className="text-[10px] font-black text-[#D7FE03] mt-1 block">{plan2Price || 'R$ 149'}</span>
                  </div>
                  <div className="h-px bg-zinc-100/80 my-1.5" />
                  <p className="text-[6px] text-zinc-500 font-mono whitespace-pre-line leading-relaxed">{plan2Features}</p>
                </div>

                {/* Plan 3 */}
                <div className="p-2 bg-white/60 border border-zinc-850 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[7.5px] font-extrabold text-black block">{plan3Name || 'Enterprise'}</span>
                    <p className="text-[6.5px] text-zinc-500 line-clamp-1">{plan3Desc || 'Para grandes volumes de dados.'}</p>
                    <span className="text-[10px] font-black text-[#D7FE03] mt-1 block">{plan3Price || 'Custom'}</span>
                  </div>
                  <div className="h-px bg-zinc-100/80 my-1.5" />
                  <p className="text-[6px] text-zinc-500 font-mono whitespace-pre-line leading-relaxed">{plan3Features}</p>
                </div>
              </div>
            </div>

            {/* 7. FAQ QUESTIONS SECTION */}
            <div 
              id="sim-faq" 
              className={`p-4 bg-white border-b border-zinc-200 space-y-3 transition-colors duration-500 ${
                activeTab === 'faq' ? 'bg-[#0f1a07]' : 'bg-white'
              }`}
            >
              <div className="space-y-0.5">
                <h2 className="text-black text-[11px] font-bold">
                  {faqTitle || 'FAQ / Dúvidas'}
                </h2>
                <p className="text-zinc-500 text-[7.5px]">
                  {faqSubtitle || 'Perguntas frequentes sobre nossa plataforma.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="p-2 bg-white/50 border border-zinc-850/80 rounded-xl">
                  <span className="text-[7px] font-extrabold text-black block">Q: {faq1Question}</span>
                  <span className="text-[6.5px] text-zinc-500 block mt-0.5 leading-normal font-sans">{faq1Answer}</span>
                </div>
                <div className="p-2 bg-white/50 border border-zinc-850/80 rounded-xl">
                  <span className="text-[7px] font-extrabold text-black block">Q: {faq2Question}</span>
                  <span className="text-[6.5px] text-zinc-500 block mt-0.5 leading-normal font-sans">{faq2Answer}</span>
                </div>
                {faq3Question && (
                  <div className="p-2 bg-white/50 border border-zinc-850/80 rounded-xl">
                    <span className="text-[7px] font-extrabold text-black block">Q: {faq3Question}</span>
                    <span className="text-[6.5px] text-zinc-500 block mt-0.5 leading-normal font-sans">{faq3Answer}</span>
                  </div>
                )}
                {faq4Question && (
                  <div className="p-2 bg-white/50 border border-zinc-850/80 rounded-xl">
                    <span className="text-[7px] font-extrabold text-black block">Q: {faq4Question}</span>
                    <span className="text-[6.5px] text-zinc-500 block mt-0.5 leading-normal font-sans">{faq4Answer}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 8. FOOTER SECTION */}
            <div 
              id="sim-footer" 
              className={`p-4 bg-[#050804] space-y-4 transition-colors duration-500 ${
                activeTab === 'footer' ? 'bg-[#0f1d07]' : 'bg-[#050804]'
              }`}
            >
              {/* Footer CTA Box */}
              <div className="p-3.5 bg-white/60 rounded-xl border border-zinc-850 text-center space-y-1.5">
                <h4 className="text-black text-[9px] font-black leading-tight">
                  {footerCtaTitle || 'Pronto para dominar?'}
                </h4>
                <p className="text-[7px] text-zinc-500 leading-normal font-light font-sans">
                  {footerCtaDesc}
                </p>
                <span className="inline-block px-3 py-1 bg-[#D7FE03] text-black font-black text-[7.5px] rounded-full shadow">
                  {footerCtaButton || 'Quero Começar'}
                </span>
              </div>

              {/* Brand Narrative */}
              <div className="space-y-1">
                <div className="text-[7.5px] font-black text-black flex items-center gap-1">
                  <span className="text-[#D7FE03]">✦</span> {brandName}
                </div>
                <p className="text-zinc-500 text-[6.5px] leading-relaxed font-light font-sans">{footerBrandNarrative}</p>
              </div>

              <div className="h-px bg-white" />

              {/* Status and Copyright */}
              <div className="flex flex-col gap-1 text-[6.5px] text-zinc-500 font-sans">
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  {footerStatusText || 'Todos os serviços online (Status: Verde)'}
                </span>
                <span>{footerCopyright || '© 2026 AnimaSystem. Inc.'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Tip Box */}
        <div className="p-3 bg-white/40 border border-zinc-850 rounded-xl flex gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-500 leading-relaxed font-light">
            <strong>Dica Visual:</strong> O simulador foca automaticamente na seção correspondente à aba ativa acima. Experimente alternar entre "Sobre Nós", "Planos" ou "FAQ" para ver o auto-scrolling em ação.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl pb-12 w-full mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
          <Palette className="w-6 h-6 text-accent" />
          Personalização Pública
        </h2>
        <p className="text-zinc-500 text-sm">
          Edite e faça upload de mídias para todas as seções institucionais de forma visual e modular.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 w-full">
        
        {/* Scrollable/Wrapped Tab selector to support 9 sections comfortably */}
        <div className="flex flex-wrap border-b border-zinc-200/60 pb-3 gap-y-3 gap-x-5">
              {[
                { id: 'text', label: 'Vitrine' },
                { id: 'banner', label: 'Header' },
                { id: 'carousel', label: 'Carrossel' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'services', label: 'Serviços' },
                { id: 'google', label: 'Núcleo' },
                { id: 'about', label: 'Sobre Nós' },
                { id: 'plans', label: 'Planos' },
                { id: 'faq', label: 'FAQ' },
                { id: 'footer', label: 'Rodapé' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-1 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                    activeTab === tab.id ? 'text-accent font-extrabold' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-[-11px] left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              
              {/* Left side: Form Inputs */}
              <div className="lg:col-span-7 space-y-6">

                {/* TAB: Texto Vitrine */}
            {activeTab === 'text' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Type className="w-4 h-4" /> Textos da Vitrine
                </h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome da Plataforma (Marca)</label>
                  <input 
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm transition-all text-black placeholder:text-zinc-600"
                    placeholder="Ex: AnimaSystem"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título Principal (Hero Headline)</label>
                  <textarea 
                    rows={3}
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm transition-all text-black placeholder:text-zinc-600 font-sans leading-relaxed custom-scrollbar resize-y"
                    placeholder="Ex: Criação inteligente. \n Estratégia real."
                  />
                  <p className="text-[10px] text-zinc-500 font-light">Dica: Use quebras de linha normais para estruturar a frase.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição Detalhada (Hero Subtitle)</label>
                  <textarea 
                    rows={4}
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm transition-all text-black placeholder:text-zinc-600 leading-relaxed custom-scrollbar resize-y"
                    placeholder="Descreva seu core business..."
                  />
                </div>
              </div>
            )}

            {/* TAB: Banner Header */}
            {activeTab === 'banner' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Elementos Visuais do Topo
                </h3>

                <div className="space-y-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Imagem do Header (Landing Page)</label>
                  
                  {heroImage && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-200 bg-white/50">
                      <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Upload className="w-4 h-4" />}
                      {isUploading ? 'Enviando...' : 'Fazer Upload de Imagem'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-zinc-100"></div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">OU LINK DIRETO</span>
                    <div className="flex-1 h-px bg-zinc-100"></div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                    <LinkIcon className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      className="bg-transparent border-none text-black text-sm w-full focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="h-px bg-zinc-100/50 my-6" />

                  {/* 3 Dashboard Banners uploads */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-[#D7FE03] tracking-wider">Banners do Dashboard</h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        Faça upload ou insira os links de até 3 pequenos banners institucionais/publicitários para exibição no painel administrativo principal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Banner 1 */}
                      <div className="bg-white/40 border border-zinc-850 p-3 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 1 (Opcional)</span>
                          {banner1Url ? (
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                              <img src={banner1Url} className="w-full h-full object-cover" alt="Banner 1" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                              <span>Vazio</span>
                              <span>123 x 123</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => banner1FileInputRef.current?.click()}
                            disabled={isBanner1Uploading}
                            className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-[10px] py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isBanner1Uploading ? <Loader2 className="w-3 animate-spin text-accent" /> : <Upload className="w-3 h-3 text-accent" />}
                            <span>{isBanner1Uploading ? "Enviando..." : "Upload"}</span>
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={banner1FileInputRef} onChange={handleBanner1Upload} />
                          <input
                            type="url"
                            placeholder="Link..."
                            value={banner1Url}
                            onChange={(e) => setBanner1Url(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] text-black outline-none focus:border-accent/40"
                          />
                        </div>
                      </div>

                      {/* Banner 2 */}
                      <div className="bg-white/40 border border-zinc-850 p-3 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 2 (Opcional)</span>
                          {banner2Url ? (
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                              <img src={banner2Url} className="w-full h-full object-cover" alt="Banner 2" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                              <span>Vazio</span>
                              <span>123 x 123</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => banner2FileInputRef.current?.click()}
                            disabled={isBanner2Uploading}
                            className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-[10px] py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isBanner2Uploading ? <Loader2 className="w-3 animate-spin text-accent" /> : <Upload className="w-3 h-3 text-accent" />}
                            <span>{isBanner2Uploading ? "Enviando..." : "Upload"}</span>
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={banner2FileInputRef} onChange={handleBanner2Upload} />
                          <input
                            type="url"
                            placeholder="Link..."
                            value={banner2Url}
                            onChange={(e) => setBanner2Url(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] text-black outline-none focus:border-accent/40"
                          />
                        </div>
                      </div>

                      {/* Banner 3 */}
                      <div className="bg-white/40 border border-zinc-850 p-3 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 3 (Opcional)</span>
                          {banner3Url ? (
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                              <img src={banner3Url} className="w-full h-full object-cover" alt="Banner 3" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                              <span>Vazio</span>
                              <span>123 x 123</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => banner3FileInputRef.current?.click()}
                            disabled={isBanner3Uploading}
                            className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-[10px] py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isBanner3Uploading ? <Loader2 className="w-3 animate-spin text-accent" /> : <Upload className="w-3 h-3 text-accent" />}
                            <span>{isBanner3Uploading ? "Enviando..." : "Upload"}</span>
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={banner3FileInputRef} onChange={handleBanner3Upload} />
                          <input
                            type="url"
                            placeholder="Link..."
                            value={banner3Url}
                            onChange={(e) => setBanner3Url(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] text-black outline-none focus:border-accent/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Dashboard internal banners */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Banners do Dashboard Interno
                </h3>

                <p className="text-zinc-500 text-xs">
                  Faça upload ou insira links para as 3 imagens de anúncios/banners da área restrita do Dashboard.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dashboard Banner 1 */}
                  <div className="bg-white/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 1 (218x112)</span>
                      {dashboardBanner1Url ? (
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                          <img src={dashboardBanner1Url} className="w-full h-full object-cover" alt="Banner 1" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                          <span>Vazio</span>
                          <span>218 x 112</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => dashboardBanner1FileInputRef.current?.click()}
                        disabled={isDashboardBanner1Uploading}
                        className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-xs py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isDashboardBanner1Uploading ? <Loader2 className="w-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5 text-accent" />}
                        <span>{isDashboardBanner1Uploading ? "Enviando..." : "Upload Imagem"}</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={dashboardBanner1FileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, setDashboardBanner1Url, setIsDashboardBanner1Uploading, "Dashboard Banner 1");
                        }} 
                      />
                      <input
                        type="url"
                        placeholder="Link direto..."
                        value={dashboardBanner1Url}
                        onChange={(e) => setDashboardBanner1Url(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black outline-none focus:border-accent/40"
                      />
                    </div>
                  </div>

                  {/* Dashboard Banner 2 */}
                  <div className="bg-white/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 2 (218x112)</span>
                      {dashboardBanner2Url ? (
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                          <img src={dashboardBanner2Url} className="w-full h-full object-cover" alt="Banner 2" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                          <span>Vazio</span>
                          <span>218 x 112</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => dashboardBanner2FileInputRef.current?.click()}
                        disabled={isDashboardBanner2Uploading}
                        className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-xs py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isDashboardBanner2Uploading ? <Loader2 className="w-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5 text-accent" />}
                        <span>{isDashboardBanner2Uploading ? "Enviando..." : "Upload Imagem"}</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={dashboardBanner2FileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, setDashboardBanner2Url, setIsDashboardBanner2Uploading, "Dashboard Banner 2");
                        }} 
                      />
                      <input
                        type="url"
                        placeholder="Link direto..."
                        value={dashboardBanner2Url}
                        onChange={(e) => setDashboardBanner2Url(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black outline-none focus:border-accent/40"
                      />
                    </div>
                  </div>

                  {/* Dashboard Banner 3 */}
                  <div className="bg-white/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">Banner 3 (218x112)</span>
                      {dashboardBanner3Url ? (
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200 bg-black/40">
                          <img src={dashboardBanner3Url} className="w-full h-full object-cover" alt="Banner 3" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-mono bg-white/20">
                          <span>Vazio</span>
                          <span>218 x 112</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => dashboardBanner3FileInputRef.current?.click()}
                        disabled={isDashboardBanner3Uploading}
                        className="w-full bg-white hover:bg-white border border-zinc-200 text-zinc-700 text-xs py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isDashboardBanner3Uploading ? <Loader2 className="w-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5 text-accent" />}
                        <span>{isDashboardBanner3Uploading ? "Enviando..." : "Upload Imagem"}</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={dashboardBanner3FileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, setDashboardBanner3Url, setIsDashboardBanner3Uploading, "Dashboard Banner 3");
                        }} 
                      />
                      <input
                        type="url"
                        placeholder="Link direto..."
                        value={dashboardBanner3Url}
                        onChange={(e) => setDashboardBanner3Url(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black outline-none focus:border-accent/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Carrossel */}
            {activeTab === 'carousel' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Carrossel de Clientes (Logo Loop)
                </h3>
                
                <p className="text-zinc-500 text-xs leading-relaxed font-light">
                  Escolha a fonte das logos que deslizam continuamente no rodapé da seção Hero da Landing Page.
                </p>

                <div className="flex gap-2 p-1 bg-white rounded-xl border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setMarqueeMode('auto')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      marqueeMode === 'auto'
                        ? 'bg-zinc-100 text-black shadow-md'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Automático (Clientes do Painel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarqueeMode('manual')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      marqueeMode === 'manual'
                        ? 'bg-zinc-100 text-black shadow-md'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Manual (Customizar Carrossel)
                  </button>
                </div>

                {marqueeMode === 'auto' ? (
                  <div className="p-4 bg-white/30 border border-zinc-200/80 rounded-xl">
                    <div className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">
                        <strong>Modo Ativo: Automático.</strong> Todas as logos e nomes dos clientes reais cadastrados na aba de <span className="text-accent">Clientes</span> serão sincronizados automaticamente no loop.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Clientes no Carrossel ({customMarqueeItems.length})</label>
                      
                      {customMarqueeItems.length === 0 ? (
                        <div className="p-8 text-center bg-white/20 border border-dashed border-zinc-200 rounded-xl text-zinc-500 text-xs">
                          Nenhum item adicionado ao carrossel manual ainda. Adicione abaixo!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {customMarqueeItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl">
                              <div className="flex items-center gap-3">
                                {item.logoUrl ? (
                                  <img src={item.logoUrl} alt={item.name} referrerPolicy="no-referrer" className="w-7 h-7 object-contain rounded bg-white/5 p-0.5" />
                                ) : (
                                  <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                                    {item.logoInitials}
                                  </div>
                                )}
                                <span className="text-xs font-medium text-zinc-800 truncate max-w-[120px]">{item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomLogo(item.id)}
                                className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isAddingLogo ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingLogo(true)}
                        className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-100/80 text-zinc-700 py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-accent" />
                        Adicionar Nova Logo Manualmente
                      </button>
                    ) : (
                      <div className="p-4 bg-white/60 border border-zinc-200 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Nova Logo do Carrossel</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Nome da Empresa</label>
                            <input
                              type="text"
                              placeholder="Ex: Flash"
                              value={newLogoName}
                              onChange={(e) => setNewLogoName(e.target.value)}
                              className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 outline-none focus:border-accent/40 text-xs text-black"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Upload da Logo (Opcional)</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isMarqueeUploading}
                                onClick={() => marqueeFileInputRef.current?.click()}
                                className="bg-white hover:bg-white border border-zinc-850 text-zinc-700 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                              >
                                {isMarqueeUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 text-accent" />
                                )}
                                <span>Logo</span>
                              </button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={marqueeFileInputRef}
                                onChange={handleMarqueeLogoUpload}
                              />
                              <input
                                type="url"
                                placeholder="Ou cole URL..."
                                value={newLogoUrl}
                                onChange={(e) => setNewLogoUrl(e.target.value)}
                                className="flex-1 bg-white border border-zinc-850 rounded-lg px-3 py-1.5 outline-none focus:border-accent/40 text-xs text-black"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingLogo(false)}
                            className="px-3 py-1.5 bg-white hover:bg-white text-zinc-500 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomLogo}
                            className="px-3 py-1.5 bg-accent hover:bg-[#c4e602] text-zinc-950 rounded-lg text-xs font-extrabold cursor-pointer"
                          >
                            Confirmar Item
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Nossos Serviços */}
            {activeTab === 'services' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Nossos Serviços
                  </h3>
                </div>

                <div className="space-y-2 border-b border-zinc-200 pb-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tag Principal da Seção</label>
                  <input 
                    type="text"
                    value={servicesTag}
                    onChange={(e) => setServicesTag(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                    placeholder="NOSSOS SERVIÇOS"
                  />
                </div>

                {/* Card 1 */}
                <div className="p-4 bg-white/50 border border-zinc-200/60 rounded-xl space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-accent tracking-widest">Card de Serviço 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Categoria</label>
                      <input 
                        type="text" 
                        value={servicesCard1Category} 
                        onChange={(e) => setServicesCard1Category(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Título do Serviço</label>
                      <input 
                        type="text" 
                        value={servicesCard1Title} 
                        onChange={(e) => setServicesCard1Title(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Imagem de Fundo</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        type="button"
                        onClick={() => service1FileInputRef.current?.click()}
                        disabled={isService1Uploading}
                        className="bg-white hover:bg-white text-zinc-700 text-xs px-4 py-2 rounded-lg border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isService1Uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5" />}
                        {isService1Uploading ? 'Enviando...' : 'Fazer Upload'}
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={service1FileInputRef} 
                        onChange={handleService1Upload} 
                      />
                      <input 
                        type="url"
                        placeholder="Ou cole a URL direta..."
                        value={servicesCard1Image}
                        onChange={(e) => setServicesCard1Image(e.target.value)}
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40"
                      />
                    </div>
                    {servicesCard1Image && (
                      <div className="w-20 h-12 rounded border border-zinc-850 overflow-hidden bg-black/40 mt-1">
                        <img src={servicesCard1Image} className="w-full h-full object-cover" alt="Preview 1" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-4 bg-white/50 border border-zinc-200/60 rounded-xl space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-accent tracking-widest">Card de Serviço 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Categoria</label>
                      <input 
                        type="text" 
                        value={servicesCard2Category} 
                        onChange={(e) => setServicesCard2Category(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Título do Serviço</label>
                      <input 
                        type="text" 
                        value={servicesCard2Title} 
                        onChange={(e) => setServicesCard2Title(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Imagem de Fundo</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        type="button"
                        onClick={() => service2FileInputRef.current?.click()}
                        disabled={isService2Uploading}
                        className="bg-white hover:bg-white text-zinc-700 text-xs px-4 py-2 rounded-lg border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isService2Uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5" />}
                        {isService2Uploading ? 'Enviando...' : 'Fazer Upload'}
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={service2FileInputRef} 
                        onChange={handleService2Upload} 
                      />
                      <input 
                        type="url"
                        placeholder="Ou cole a URL direta..."
                        value={servicesCard2Image}
                        onChange={(e) => setServicesCard2Image(e.target.value)}
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40"
                      />
                    </div>
                    {servicesCard2Image && (
                      <div className="w-20 h-12 rounded border border-zinc-850 overflow-hidden bg-black/40 mt-1">
                        <img src={servicesCard2Image} className="w-full h-full object-cover" alt="Preview 2" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3 */}
                <div className="p-4 bg-white/50 border border-zinc-200/60 rounded-xl space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-accent tracking-widest">Card de Serviço 3</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Categoria</label>
                      <input 
                        type="text" 
                        value={servicesCard3Category} 
                        onChange={(e) => setServicesCard3Category(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Título do Serviço</label>
                      <input 
                        type="text" 
                        value={servicesCard3Title} 
                        onChange={(e) => setServicesCard3Title(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Imagem de Fundo</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        type="button"
                        onClick={() => service3FileInputRef.current?.click()}
                        disabled={isService3Uploading}
                        className="bg-white hover:bg-white text-zinc-700 text-xs px-4 py-2 rounded-lg border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isService3Uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> : <Upload className="w-3.5 h-3.5" />}
                        {isService3Uploading ? 'Enviando...' : 'Fazer Upload'}
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={service3FileInputRef} 
                        onChange={handleService3Upload} 
                      />
                      <input 
                        type="url"
                        placeholder="Ou cole a URL direta..."
                        value={servicesCard3Image}
                        onChange={(e) => setServicesCard3Image(e.target.value)}
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-accent/40"
                      />
                    </div>
                    {servicesCard3Image && (
                      <div className="w-20 h-12 rounded border border-zinc-850 overflow-hidden bg-black/40 mt-1">
                        <img src={servicesCard3Image} className="w-full h-full object-cover" alt="Preview 3" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Núcleo Google */}
            {activeTab === 'google' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Server className="w-4 h-4" /> Núcleo Google Cloud
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tag Principal</label>
                  <input 
                    type="text"
                    value={googleTag}
                    onChange={(e) => setGoogleTag(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título Principal</label>
                  <input 
                    type="text"
                    value={googleTitle}
                    onChange={(e) => setGoogleTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição Detalhada</label>
                  <textarea 
                    rows={4}
                    value={googleDescription}
                    onChange={(e) => setGoogleDescription(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black leading-relaxed custom-scrollbar resize-y"
                  />
                </div>

                <div className="h-px bg-white/60 my-4" />
                <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Pilares de Infraestrutura</h4>

                {/* Pillar 1 */}
                <div className="p-3 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-[#D7FE03] font-extrabold tracking-wider uppercase">Pilar 1</label>
                  <input 
                    type="text" 
                    value={googlePillar1Title} 
                    onChange={(e) => setGooglePillar1Title(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold focus:outline-none focus:border-accent/40" 
                    placeholder="Título do pilar"
                  />
                  <textarea 
                    value={googlePillar1Desc} 
                    onChange={(e) => setGooglePillar1Desc(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none focus:border-accent/40 h-16 resize-none" 
                    placeholder="Descrição do pilar"
                  />
                </div>

                {/* Pillar 2 */}
                <div className="p-3 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-[#D7FE03] font-extrabold tracking-wider uppercase">Pilar 2</label>
                  <input 
                    type="text" 
                    value={googlePillar2Title} 
                    onChange={(e) => setGooglePillar2Title(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold focus:outline-none focus:border-accent/40" 
                  />
                  <textarea 
                    value={googlePillar2Desc} 
                    onChange={(e) => setGooglePillar2Desc(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none focus:border-accent/40 h-16 resize-none" 
                  />
                </div>

                {/* Pillar 3 */}
                <div className="p-3 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-[#D7FE03] font-extrabold tracking-wider uppercase">Pilar 3</label>
                  <input 
                    type="text" 
                    value={googlePillar3Title} 
                    onChange={(e) => setGooglePillar3Title(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold focus:outline-none focus:border-accent/40" 
                  />
                  <textarea 
                    value={googlePillar3Desc} 
                    onChange={(e) => setGooglePillar3Desc(e.target.value)} 
                    className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none focus:border-accent/40 h-16 resize-none" 
                  />
                </div>
              </div>
            )}

            {/* TAB: Sobre Nós */}
            {activeTab === 'about' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Info className="w-4 h-4" /> Sobre Nós
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tag Principal</label>
                  <input 
                    type="text"
                    value={aboutTag}
                    onChange={(e) => setAboutTag(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título (Destaque Principal)</label>
                  <textarea 
                    rows={2}
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição Narrativa</label>
                  <textarea 
                    rows={4}
                    value={aboutDescription}
                    onChange={(e) => setAboutDescription(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black leading-relaxed custom-scrollbar resize-y"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Imagem Substituta do Card Performe</label>
                  
                  {aboutImage && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-200 bg-white/50">
                      <img src={aboutImage} alt="Sobre Nós Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => aboutFileInputRef.current?.click()}
                      disabled={isAboutUploading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isAboutUploading ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Upload className="w-4 h-4" />}
                      {isAboutUploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={aboutFileInputRef} 
                      onChange={handleAboutUpload} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-zinc-100"></div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">OU LINK DIRETO</span>
                    <div className="flex-1 h-px bg-zinc-100"></div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                    <LinkIcon className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="url"
                      placeholder="https://exemplo.com/sobre.jpg"
                      value={aboutImage}
                      onChange={(e) => setAboutImage(e.target.value)}
                      className="bg-transparent border-none text-black text-sm w-full focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Planos */}
            {activeTab === 'plans' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Planos & Precificação
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tag Principal</label>
                  <input 
                    type="text"
                    value={plansTag}
                    onChange={(e) => setPlansTag(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título da Seção de Planos</label>
                  <input 
                    type="text"
                    value={plansTitle}
                    onChange={(e) => setPlansTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição dos Planos</label>
                  <textarea 
                    rows={3}
                    value={plansDescription}
                    onChange={(e) => setPlansDescription(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black resize-y"
                  />
                </div>

                <div className="h-px bg-white my-4" />
                <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Estrutura das 3 Opções de Planos</h4>

                {/* Plan 1 */}
                <div className="p-4 bg-white/35 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] text-[#D7FE03] font-extrabold uppercase tracking-widest">Plano 1 (Iniciante)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Nome</label>
                      <input type="text" value={plan1Name} onChange={(e) => setPlan1Name(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Preço</label>
                      <input type="text" value={plan1Price} onChange={(e) => setPlan1Price(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Descrição Curta</label>
                    <input type="text" value={plan1Desc} onChange={(e) => setPlan1Desc(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Benefícios (Um por linha)</label>
                    <textarea rows={3} value={plan1Features} onChange={(e) => setPlan1Features(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 leading-relaxed custom-scrollbar" placeholder="Ex: 3 apps\nSuporte padrão" />
                  </div>
                </div>

                {/* Plan 2 */}
                <div className="p-4 bg-white/35 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest">Plano 2 (Destaque)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Nome</label>
                      <input type="text" value={plan2Name} onChange={(e) => setPlan2Name(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Preço</label>
                      <input type="text" value={plan2Price} onChange={(e) => setPlan2Price(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Descrição Curta</label>
                    <input type="text" value={plan2Desc} onChange={(e) => setPlan2Desc(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Benefícios (Um por linha)</label>
                    <textarea rows={4} value={plan2Features} onChange={(e) => setPlan2Features(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 leading-relaxed" />
                  </div>
                </div>

                {/* Plan 3 */}
                <div className="p-4 bg-white/35 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] text-[#D7FE03] font-extrabold uppercase tracking-widest">Plano 3 (Enterprise)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Nome</label>
                      <input type="text" value={plan3Name} onChange={(e) => setPlan3Name(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Preço</label>
                      <input type="text" value={plan3Price} onChange={(e) => setPlan3Price(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Descrição Curta</label>
                    <input type="text" value={plan3Desc} onChange={(e) => setPlan3Desc(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Benefícios (Um por linha)</label>
                    <textarea rows={3} value={plan3Features} onChange={(e) => setPlan3Features(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 leading-relaxed" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Perguntas Frequentes
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título Principal</label>
                  <input 
                    type="text"
                    value={faqTitle}
                    onChange={(e) => setFaqTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subtítulo do FAQ</label>
                  <input 
                    type="text"
                    value={faqSubtitle}
                    onChange={(e) => setFaqSubtitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="h-px bg-white my-4" />

                {/* FAQ 1 */}
                <div className="p-3.5 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-accent font-extrabold uppercase">Pergunta 1</label>
                  <input type="text" value={faq1Question} onChange={(e) => setFaq1Question(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold" />
                  <textarea value={faq1Answer} onChange={(e) => setFaq1Answer(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 h-16 resize-none" />
                </div>

                {/* FAQ 2 */}
                <div className="p-3.5 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-accent font-extrabold uppercase">Pergunta 2</label>
                  <input type="text" value={faq2Question} onChange={(e) => setFaq2Question(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold" />
                  <textarea value={faq2Answer} onChange={(e) => setFaq2Answer(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 h-16 resize-none" />
                </div>

                {/* FAQ 3 */}
                <div className="p-3.5 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-accent font-extrabold uppercase">Pergunta 3</label>
                  <input type="text" value={faq3Question} onChange={(e) => setFaq3Question(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold" />
                  <textarea value={faq3Answer} onChange={(e) => setFaq3Answer(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 h-16 resize-none" />
                </div>

                {/* FAQ 4 */}
                <div className="p-3.5 bg-white/35 border border-zinc-850 rounded-xl space-y-2">
                  <label className="text-[10px] text-accent font-extrabold uppercase">Pergunta 4</label>
                  <input type="text" value={faq4Question} onChange={(e) => setFaq4Question(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-black font-semibold" />
                  <textarea value={faq4Answer} onChange={(e) => setFaq4Answer(e.target.value)} className="w-full bg-white border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-500 h-16 resize-none" />
                </div>
              </div>
            )}

            {/* TAB: Rodapé */}
            {activeTab === 'footer' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Rodapé & CTA Final
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Título do Banner CTA</label>
                  <input 
                    type="text"
                    value={footerCtaTitle}
                    onChange={(e) => setFooterCtaTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Descrição do Banner CTA</label>
                  <textarea 
                    rows={2}
                    value={footerCtaDesc}
                    onChange={(e) => setFooterCtaDesc(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Texto do Botão de Ação CTA</label>
                  <input 
                    type="text"
                    value={footerCtaButton}
                    onChange={(e) => setFooterCtaButton(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="h-px bg-white my-4" />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Narrativa Institucional (Abaixo do Logo)</label>
                  <textarea 
                    rows={2}
                    value={footerBrandNarrative}
                    onChange={(e) => setFooterBrandNarrative(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Título Coluna 1</label>
                    <input type="text" value={footerColumn1Title} onChange={(e) => setFooterColumn1Title(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Título Coluna 2</label>
                    <input type="text" value={footerColumn2Title} onChange={(e) => setFooterColumn2Title(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Título Coluna 3</label>
                    <input type="text" value={footerColumn3Title} onChange={(e) => setFooterColumn3Title(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-black" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Texto de Copyright</label>
                  <input 
                    type="text"
                    value={footerCopyright}
                    onChange={(e) => setFooterCopyright(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-bold">Texto de Status dos Serviços (Online Verde)</label>
                  <input 
                    type="text"
                    value={footerStatusText}
                    onChange={(e) => setFooterStatusText(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm text-black"
                  />
                </div>
              </div>
            )}

            {/* Persistent General Save Button (Always visible on all tabs) */}
            <div className="flex justify-end pt-4 border-t border-zinc-200">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving || isUploading || isMarqueeUploading || isService1Uploading || isService2Uploading || isService3Uploading || isAboutUploading}
                className="bg-accent hover:bg-[#c4e602] text-zinc-950 font-extrabold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Toda a Personalização
              </button>
            </div>

          </div>

          {/* Right side: Live Simulator (rendered directly inside the Tab Container card) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {renderSimulator()}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}