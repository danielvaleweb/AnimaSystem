import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Settings2, Key, Shield, Database, Cloud, 
  ArrowRight, Lock, Server, FileJson, CheckCircle2,
  AlertTriangle, Activity, FileText, Bell, HardDrive,
  Image as ImageIcon, Upload, Link as LinkIcon, Loader2,
  Rocket, Hand, Power, Code, Clock, Info
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { cn } from '../../utils';
import { useNotification } from '../NotificationContext';

export function SettingsView() {
  const { showSuccess, showInfo, showWarn, showError, showSecondary, showContrast } = useNotification();
  const [activeTab, setActiveTab] = useState<'geral' | 'integracao'>('integracao');
  const [heroImage, setHeroImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.heroImage) setHeroImage(data.heroImage);
        }
      } catch (error) {
        console.error("Error loading settings", error);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, { heroImage }, { merge: true });
      showSuccess("Configurações salvas", "As preferências globais foram persistidas com sucesso.");
    } catch (error) {
      console.error("Error saving settings", error);
      showError("Falha de gravação", "Não foi possível gravar as novas configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `settings/hero_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {},
        (error) => {
          console.error("Upload error", error);
          showError("Falha de Upload", "Ocorreu um erro ao carregar a imagem selecionada.");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setHeroImage(downloadURL);
          showSuccess("Upload Concluído", "A nova imagem do header foi carregada com sucesso.");
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error("Error uploading file", error);
      showError("Falha de Upload", "Ocorreu um erro ao inicializar o upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <Settings2 className="w-8 h-8 text-accent" />
          </div>
          <div>
             <h2 className="font-display text-2xl font-bold text-zinc-100">Configurações e Integração</h2>
             <p className="text-zinc-400 text-sm mt-1">
               Gerencie as credenciais globais e a arquitetura de conexão cross-project.
             </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        
        {/* Navigation Sidebar */}
        <div className="w-64 shrink-0 space-y-2 hidden md:block">
          <button 
            onClick={() => setActiveTab('integracao')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'integracao' 
                ? "bg-zinc-900 text-accent border border-zinc-800/50" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent"
            )}
          >
            <Cloud className="w-4 h-4" />
            Arquitetura Multi-Tenant
          </button>
          <button 
            onClick={() => setActiveTab('geral')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'geral' 
                ? "bg-zinc-900 text-accent border border-zinc-800/50" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent"
            )}
          >
            <Settings2 className="w-4 h-4" />
            Configurações Gerais
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 overflow-y-auto">
          
          {activeTab === 'integracao' && (
            <div className="space-y-10 max-w-4xl">
              <div>
                <h3 className="font-display text-2xl font-bold mb-2">Conexão Múltiplos Firebase Projects</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  A plataforma utiliza um modelo de ingestão híbrido (Pull para métricas periódicas e Push para eventos críticos), focado em <b>redução de custos</b> e <b>segurança by design</b>. Nenhum dado privado dos clientes é acessado, garantindo o "Privilégio Mínimo" via IAM Roles restritas.
                </p>
              </div>

              {/* Diagram */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-zinc-950 to-zinc-950"></div>
                
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8 relative z-10">Topologia de Ingestão</h4>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Master Node */}
                  <div className="bg-zinc-900 border border-accent/30 rounded-xl p-5 w-full md:w-64 shadow-xl shadow-accent/5">
                    <h5 className="font-bold text-accent flex items-center gap-2 mb-4">
                      <Server className="w-4 h-4" />
                      AnimaSystem Master
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 rounded border border-zinc-800 p-2">
                        <Activity className="w-3.5 h-3.5 text-blue-400" /> API: Endpoint Agregador
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 rounded border border-zinc-800 p-2">
                         <Cloud className="w-3.5 h-3.5 text-emerald-400" /> Cloud Functions (Process)
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 rounded border border-zinc-800 p-2">
                         <Shield className="w-3.5 h-3.5 text-purple-400" /> Secret Manager (Keys)
                      </div>
                    </div>
                  </div>

                  {/* Flow Arrows */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                     <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-widest text-center">Pull (Métricas)<br/>Push (Alertas)</p>
                     <ArrowRight className="w-8 h-8 text-zinc-700 hidden md:block" />
                     <div className="w-0.5 h-8 bg-zinc-700 md:hidden block my-2"></div>
                  </div>

                  {/* Client GCP Nodes Container */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full md:w-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Lock className="w-16 h-16 text-zinc-100" />
                    </div>
                    <h5 className="font-bold text-zinc-200 flex items-center gap-2 mb-4 relative z-10">
                      <Database className="w-4 h-4" />
                      Client Projects
                    </h5>
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Log Sink<br/><span className="text-zinc-500">Only Errors & Critical</span></span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Cloud Monitoring<br/><span className="text-zinc-500">Service Accounts Restritas</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Layers Breakdown */}
              <div>
                <h3 className="font-display text-xl font-bold mb-6">Estratégias de Extração e Minimização de Custos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Metrics & Consumption */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-zinc-200 mb-3">
                      <Activity className="w-5 h-5 text-accent" />
                      Coleta de Consumo e Métricas
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                      Ao invés de escutar o Firebase em tempo real (muito caro), usamos um padrão Pull.
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4">
                      <li>Um <strong>Cloud Scheduler</strong> roda scripts em lotes (ex: 1x por hora).</li>
                      <li>Consultamos a <strong>Cloud Monitoring API</strong> (<code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">monitoring.googleapis.com</code>) para extrair contadores exatos (Firestore Reads, Firebase Auth Sessions, Cloud Storage Bytes).</li>
                      <li>Utilizamos Service Accounts nativas cadastradas no <strong>Secret Manager</strong> com a policy super restrita <code>roles/monitoring.viewer</code>. PII e dados de Firestore DB ficam totalmente bloqueados.</li>
                    </ul>
                  </div>

                  {/* Logs */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-zinc-200 mb-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Coleta de Logs (Erros e Falhas)
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                      Para evitar cobrar milhares de requisições, utilizamos Push Event-Driven.
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4">
                      <li>Criamos um <strong>Log Router Sink</strong> em cada projeto cliente.</li>
                      <li>Configuramos o filtro avançado do Logging para pegar apenas níveis <code>ERROR</code>, <code>CRITICAL</code> e <code>EMERGENCY</code>.</li>
                      <li>O Sink encaminha os logs via <strong>Pub/Sub</strong> inter-project diretamente para a AnimaSystem Master, processando os logs em streaming apenas quando acontecem acidentes gravíssimos.</li>
                    </ul>
                  </div>

                  {/* Alerts */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-zinc-200 mb-3">
                      <Bell className="w-5 h-5 text-orange-400" />
                      Alertas de Threshold e Saúde
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                      Notificações instantâneas quando sistemas operam no limite (Quota Limiting).
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4">
                      <li>Deployment de <strong>Alerting Policies</strong> via Terraform/Script em cada projeto cliente (ex: quando CPU da Cloud Function bate 90%).</li>
                      <li>Policy engatilhará uma notificação via <strong>Webhook Customizado</strong>.</li>
                      <li>A URL do Webhook aponta para a API segurada da AnimaSystem, criando o alerta instantâneo na nossa interface de Monitoramento sem precisar ficar fazendo polling eterno.</li>
                    </ul>
                  </div>

                  {/* Storage Strategy */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-zinc-200 mb-3">
                      <HardDrive className="w-5 h-5 text-purple-400" />
                      Armazenamento Agregado (Baixo Custo)
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                      Onde salvamos os TBs de dados vindos dos clientes de forma inteligente?
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4">
                      <li><strong>Snapshot a frio (Histórico longo):</strong> Todos os logs e métricas agregadas são gravados no <strong>Google BigQuery</strong>, o que torna a retenção baratíssima e permite rodar relatórios analíticos sem onerar o banco principal.</li>
                      <li><strong>Snapshot a quente (Dashboards Real-time):</strong> A Cloud Function mantém um doc sumarizado atualizado por cliente em nosso <strong>Firestore Master</strong>. Nossos Dashboards leem apenas este doc compilado, garantindo um custo irrisório de Reads no Firestore da AnimaSystem, mesmo com milhares de acessos ao painel.</li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'geral' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="font-display text-2xl font-bold mb-2 text-zinc-100">Configurações Gerais</h3>
                <p className="text-zinc-400 text-sm">Personalize a aparência e funcionamento padrão da sua vitrine de serviços.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <h4 className="flex items-center gap-2 font-bold text-zinc-200 mb-4">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  Imagem do Header (Landing Page)
                </h4>
                
                <div className="space-y-4">
                  {heroImage && (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 border border-zinc-800">
                      <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Upload className="w-4 h-4" />}
                      {isUploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-zinc-800"></div>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">OU LINK DIRETO</span>
                    <div className="flex-1 h-px bg-zinc-800"></div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <LinkIcon className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-accent hover:bg-[#86e029] text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    Salvar Configurações
                  </button>
                </div>
              </div>

              {/* ToastSeverityDemo - Notification Model Playground */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <h4 className="flex items-center gap-2.5 font-bold text-zinc-200 mb-2">
                  <Bell className="w-5 h-5 text-accent" />
                  Modelo de Notificação (ToastSeverityDemo)
                </h4>
                <p className="text-zinc-400 text-xs mb-6">
                  Protótipo interativo do sistema de toasts configurado sob demanda na AnimaSystem. Teste as variantes decoradas com a paleta institucional (verde, branco, cinza e preto).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => showSuccess('Sucesso', 'Operação realizada com absoluto sucesso!')}
                    className="flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-semibold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Rocket className="w-4 h-4 shrink-0" />
                    Success
                  </button>

                  <button
                    onClick={() => showInfo('Mensagem Informativa', 'Esta é uma notificação do tipo informativa.')}
                    className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-semibold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    Info
                  </button>

                  <button
                    onClick={() => showWarn('Atenção', 'Verifique com cautela esta ação pendente.')}
                    className="flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-semibold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Warn
                  </button>

                  <button
                    onClick={() => showError('Falha de Sistema', 'Houve um erro crítico na comunicação do Firebase.')}
                    className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Power className="w-4 h-4 shrink-0" />
                    Error
                  </button>

                  <button
                    onClick={() => showSecondary('Secundário', 'Log secundário processado em background.')}
                    className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Code className="w-4 h-4 shrink-0" />
                    Secondary
                  </button>

                  <button
                    onClick={() => showContrast('Contraste Máximo', 'Notificação de alto impacto visual.')}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Hand className="w-4 h-4 shrink-0" />
                    Contrast
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

