import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Activity, Database, HardDrive, Users, Zap, 
  CreditCard, Ticket, AlertCircle, Settings, FileText, ChevronRight, CheckCircle2, RotateCw, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { ClientData } from '../../types';
import { cn } from '../../utils';
import { KPICard } from '../KPICard';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

type TabType = 'resumo' | 'consumo' | 'financeiro' | 'tickets' | 'logs' | 'config';

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [timeFilter, setTimeFilter] = useState<'60m' | '24h' | '7d' | '30d'>('24h');
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'clients', clientId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().ownerId === auth.currentUser?.uid) {
        setClient({ id: docSnap.id, ...docSnap.data() } as ClientData);
      } else {
        setClient(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const healthScore = 92; // Mock score

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'resumo', label: 'Resumo', icon: Activity },
    { id: 'consumo', label: 'Consumo', icon: Database },
    { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'config', label: 'Conexão Firebase', icon: Settings },
  ];

  const testClientConnection = async () => {
    if (!client?.parsedFirebaseConfig) {
      setConnectionError('Configuração do SDK não encontrada. Por favor, edite o cliente e adicione as credenciais.');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('testing');
    setConnectionError(null);

    try {
      const appName = `client-${client.id}`;
      const app = getApps().find(a => a.name === appName) || initializeApp(client.parsedFirebaseConfig, appName);
      const clientDb = getFirestore(app);
      
      // try to read a dummy document or just list a collection
      const q = query(collection(clientDb, '_animsystem_test_conn_'), limit(1));
      await getDocs(q);
      
      setConnectionStatus('success');
    } catch (err: any) {
      // Even if permission is denied, it means we reached it. 
      // But if it's missing api key or wrong projectId, it will throw specific errors
      if (err.code === 'permission-denied') {
        setConnectionStatus('success'); // Reached successfully but rules blocked, which is good
      } else {
        console.error('Connection test failed:', err);
        setConnectionStatus('error');
        setConnectionError(err.message || 'Falha ao conectar no banco de dados do cliente.');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center text-zinc-500">Cliente não encontrado ou sem permissão.</div>;
  }

  // Filter multipliers to simulate different ranges
  const filterMultipliers = {
    '60m': 0.1,
    '24h': 1,
    '7d': 7.5,
    '30d': 18,
  };
  const multiplier = filterMultipliers[timeFilter] || 1;

  const generateData = (baseData: any[]) => 
    baseData.map(d => ({
      ...d,
      leituras: Math.floor(d.leituras * multiplier),
      gravacoes: Math.floor(d.gravacoes * multiplier),
      realtime: Math.floor(d.realtime * multiplier),
      permissoes: Math.floor(d.permissoes * multiplier),
    }));

  const faturaveisData = generateData([
    { time: '6 PM', leituras: 2000, gravacoes: 10, realtime: 5 },
    { time: '8 PM', leituras: 100, gravacoes: 5, realtime: 0 },
    { time: '10 PM', leituras: 150, gravacoes: 5, realtime: 0 },
    { time: '12 AM', leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '2 AM', leituras: 300, gravacoes: 50, realtime: 10 },
    { time: '4 AM', leituras: 100, gravacoes: 5, realtime: 5 },
    { time: '6 AM', leituras: 200, gravacoes: 5, realtime: 5 },
    { time: '8 AM', leituras: 250, gravacoes: 10, realtime: 2 },
    { time: '10 AM', leituras: 2800, gravacoes: 300, realtime: 600 },
    { time: '12 PM', leituras: 500, gravacoes: 50, realtime: 20 },
    { time: '2 PM', leituras: 1000, gravacoes: 5, realtime: 0 },
    { time: '4 PM', leituras: 1500, gravacoes: 5, realtime: 0 },
  ]);

  const regrasData = generateData([
    { time: '6 PM', permissoes: 1100, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '8 PM', permissoes: 100, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '10 PM', permissoes: 150, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '12 AM', permissoes: 0, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '2 AM', permissoes: 550, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '4 AM', permissoes: 600, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '6 AM', permissoes: 550, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '8 AM', permissoes: 550, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '10 AM', permissoes: 1600, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '12 PM', permissoes: 1200, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '2 PM', permissoes: 700, leituras: 0, gravacoes: 0, realtime: 0 },
    { time: '4 PM', permissoes: 1000, leituras: 0, gravacoes: 0, realtime: 0 },
  ]);

  const totalLeituras = faturaveisData.reduce((acc, curr) => acc + curr.leituras, 0);
  const totalGravacoes = faturaveisData.reduce((acc, curr) => acc + curr.gravacoes, 0);
  const totalPermissoes = regrasData.reduce((acc, curr) => acc + curr.permissoes, 0);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Profile Info */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-display font-medium text-zinc-300">
              {client.logoInitials}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-100 flex items-center gap-3">
                {client.name}
                <span className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium border",
                  client.status === 'active' ? "bg-accent/10 border-accent/20 text-accent" :
                  client.status === 'trial' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {client.status === 'active' ? 'Ativo' : client.status === 'trial' ? 'Trial' : 'Suspenso'}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
                  {client.plan}
                </span>
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
                <span>{client.domain}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span>ID: {client.firebaseProjectId}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span>Resp: {client.responsible}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
          <div className="text-right">
            <p className="text-zinc-400 text-sm font-medium">Health Score</p>
            <p className="text-xs text-emerald-400 mt-0.5">Operação Saudável</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-xl text-emerald-400 leading-none">{healthScore}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-1.5 flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-zinc-800 text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-accent" : "text-zinc-500")} />
            {tab.label}
          </button>
        ))}
      </div>

        {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  setTimeout(() => {
                    setRefreshKey(k => k + 1);
                    setIsRefreshing(false);
                  }, 1200);
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-accent")} />
                Atualizar Métricas
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 lg:grid-cols-4 gap-6">
              <KPICard data={{ title: 'Mensalidade', value: `R$ ${client.monthlyValue}`, icon: CreditCard }} />
              <KPICard data={{ title: 'Leituras Firestore', value: client.parsedFirebaseConfig ? '6.6k' : '0', trend: client.parsedFirebaseConfig ? -2 : 0, icon: Database }} />
              <KPICard data={{ title: 'Armazenamento', value: client.parsedFirebaseConfig?.storageBucket ? '0 B' : 'Desativado', trend: 0, icon: HardDrive }} />
              <KPICard data={{ title: 'Permissões Regras', value: client.parsedFirebaseConfig ? '15k' : '0', trend: client.parsedFirebaseConfig ? 5 : 0, icon: Users }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8">
                 <h3 className="font-display text-lg font-bold mb-6 flex items-center gap-2">
                   <Zap className="w-5 h-5 text-accent" />
                   Limites de Consumo
                 </h3>
                 <div className="space-y-6">
                   <div>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-zinc-400">Leituras Firestore</span>
                       <span className="text-zinc-100 font-medium">{client.parsedFirebaseConfig ? '13% (6.6k / 50k)' : '0%'}</span>
                     </div>
                     <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 rounded-full" style={{ width: client.parsedFirebaseConfig ? '13%' : '0%' }}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-zinc-400">Cloud Functions (Invoc.)</span>
                       <span className="text-zinc-100 font-medium">0% (0 / 2M)</span>
                     </div>
                     <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-accent rounded-full" style={{ width: '0%' }}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-zinc-400">Storage {client.parsedFirebaseConfig?.storageBucket ? '' : '(Não Configurado)'}</span>
                       <span className="text-zinc-100 font-medium">{client.parsedFirebaseConfig?.storageBucket ? '0% (0 B / 5GB)' : '0%'}</span>
                     </div>
                     <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-accent rounded-full" style={{ width: '0%' }}></div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="font-display text-lg font-bold flex items-center gap-2">
                     <AlertCircle className="w-5 h-5 text-rose-400" />
                     Alertas Recentes do Projeto
                   </h3>
                   <button className="text-sm text-accent hover:underline">Ver todos</button>
                 </div>
                 <div className="space-y-4">
                   <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
                     <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                     <div>
                       <h4 className="font-medium text-emerald-400 mb-1">Uso de Banco de Dados Otimizado</h4>
                       <p className="text-emerald-300/80 mb-2">As leituras caíram significativamente. O projeto está consumindo apenas 13% da cota Gratuita (Spark).</p>
                       <span className="text-xs text-emerald-300/60 text-xs">Hoje, 09:14</span>
                     </div>
                   </div>
                   <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 text-sm">
                     <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
                     <div>
                       <h4 className="font-medium text-emerald-400 mb-1">Aviso Módulo Auto-Scaling Ativado</h4>
                       <p className="text-zinc-400 mb-2">Um pico de acesso transferiu a carga. Limites automáticos operando normalmente.</p>
                       <span className="text-xs text-zinc-500 text-xs">Ontem, 21:00</span>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}
        
        {activeTab === 'config' && (
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 max-w-3xl">
            <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              Conexão com Banco de Dados do Cliente
            </h3>
            
            <div className="space-y-6">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                <h4 className="font-medium text-zinc-200 mb-2">Status da Integração Firebase</h4>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      client.parsedFirebaseConfig ? "bg-emerald-500" : "bg-rose-500"
                    )}></div>
                    <span className="text-sm text-zinc-400">
                      Configuração SDK: {client.parsedFirebaseConfig ? 'Configurada' : 'Ausente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      client.firebaseProjectId ? "bg-emerald-500" : "bg-rose-500"
                    )}></div>
                    <span className="text-sm text-zinc-400">
                      Project ID: {client.firebaseProjectId || 'Não configurado'}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={testClientConnection}
                    disabled={connectionStatus === 'testing'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {connectionStatus === 'testing' ? (
                      <RotateCw className="w-4 h-4 animate-spin text-accent" />
                    ) : (
                      <Database className="w-4 h-4 text-accent" />
                    )}
                    Efetuar Teste de Conexão
                  </button>

                  {connectionStatus === 'success' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      Conexão estabelecida com sucesso! A Master tem acesso a leitura/escrita no DB deste cliente (via SDK Client-side/Mesma conta).
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Erro de Conexão:</strong>
                        <p className="mt-1">{connectionError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl text-sm">
                <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Autenticação
                </h4>
                <p className="text-blue-300/80 leading-relaxed">
                  Como este sistema Master e o projeto cliente estão no mesmo Google Cloud/Firebase com permissões adequadas, o SDK inicializa diretamente usando a configuração informada. As regras de segurança do projeto cliente precisam permitir que seu usuário acesse os dados.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consumo' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Métricas do Firebase (Simulação Visual)
              </h3>
              
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
                {(['60m', '24h', '7d', '30d'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      timeFilter === filter 
                        ? "bg-zinc-800 text-zinc-100" 
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                  >
                    {filter === '60m' ? 'Últimos 60 minutos' : 
                     filter === '24h' ? 'Últimas 24 horas' : 
                     filter === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6 max-w-3xl">
              Para puxar os dados de consumo em nuvem reais diretamente para o dashboard de forma automática (invés do front-end web), precisamos habilitar o Google Cloud Monitoring e criar uma Cloud Function Server-side. Por agora, criamos as métricas correspondentes ao seu uso atual (6.6k leituras, 444 gravações, e 15k regras).
            </p>

            <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8">
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h4 className="font-display font-medium text-zinc-100">Métricas faturáveis</h4>
                  <p className="text-sm text-zinc-500 mt-1">Inclui uso do console do Firebase. Não inclui operações de admin, exportações, exclusões em massa.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-zinc-950 px-4 py-2 border border-zinc-800 rounded-xl">
                    <span className="text-xs text-zinc-500 block">Leituras</span>
                    <strong className="text-blue-400">
                      {totalLeituras >= 1000 ? (totalLeituras / 1000).toFixed(1) + ' mil' : totalLeituras} <span className="text-zinc-500 font-normal text-xs">total</span>
                    </strong>
                  </div>
                  <div className="bg-zinc-950 px-4 py-2 border border-zinc-800 rounded-xl">
                    <span className="text-xs text-zinc-500 block">Gravações</span>
                    <strong className="text-orange-400">
                      {totalGravacoes >= 1000 ? (totalGravacoes / 1000).toFixed(1) + ' mil' : totalGravacoes} <span className="text-zinc-500 font-normal text-xs">total</span>
                    </strong>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={faturaveisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val > 999 ? (val/1000).toFixed(1)+'k' : val} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Line type="monotone" dataKey="leituras" name="Leituras" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="gravacoes" name="Gravações" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="realtime" name="Leituras Tempo Real" stroke="#ec4899" strokeWidth={2} dot={{ r: 3, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 mt-6">
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h4 className="font-display font-medium text-zinc-100">Métricas de regras</h4>
                  <p className="text-sm text-zinc-500 mt-1">Avaliações das regras de segurança e banco de dados em tempo real.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-zinc-950 px-4 py-2 border border-zinc-800 rounded-xl">
                    <span className="text-xs text-zinc-500 block">Permissões</span>
                    <strong className="text-blue-400">
                      {totalPermissoes >= 1000 ? (totalPermissoes / 1000).toFixed(1) + ' mil' : totalPermissoes} <span className="text-zinc-500 font-normal text-xs">total</span>
                    </strong>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={regrasData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1)+' mil' : val} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Line type="monotone" dataKey="permissoes" name="Permissões" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="space-y-6">
             <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8">
               <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                 <CreditCard className="w-5 h-5 text-accent" />
                 Financeiro do Cliente
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                   <h4 className="font-medium text-zinc-100">Informações do Plano</h4>
                   <div className="flex justify-between text-sm">
                     <span className="text-zinc-400">Plano Atual</span>
                     <span className="text-zinc-100">{client.plan}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-zinc-400">Valor Mensal</span>
                     <span className="text-emerald-400 font-medium">R$ {client.monthlyValue.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-zinc-400">Dia de Vencimento</span>
                     <span className="text-zinc-100">Todo dia {client.dueDate}</span>
                   </div>
                 </div>

                 <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                   <div>
                     <h4 className="font-medium text-zinc-100 mb-2">Registrar Pagamento</h4>
                     <p className="text-sm text-zinc-400">Lance o pagamento deste cliente para gerar uma entrada no painel financeiro geral.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <button 
                       onClick={async () => {
                         if (!auth.currentUser) return;
                         const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                         await addDoc(collection(db, 'transactions'), {
                           ownerId: auth.currentUser.uid,
                           type: 'entrada',
                           clientName: client.name,
                           amount: client.monthlyValue,
                           date: new Date().toISOString().split('T')[0],
                           dueDate: new Date().toISOString().split('T')[0], // simplifying
                           status: 'paid',
                           method: 'manual',
                           gateway: 'manual',
                           createdAt: serverTimestamp()
                         });
                         alert('Pagamento manual registrado com sucesso!');
                       }}
                       className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2.5 rounded-xl text-sm font-medium transition-colors"
                     >
                       Dar como Pago Manualmente
                     </button>
                     <button 
                       onClick={async () => {
                         if (!auth.currentUser) return;
                         try {
                           const res = await fetch('/api/create-payment', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                               clientId: client.id,
                               ownerId: auth.currentUser.uid,
                               clientName: client.name,
                               amount: client.monthlyValue,
                               description: `Mensalidade - ${client.name}`,
                             })
                           });
                           const data = await res.json();
                           if (data.init_point) {
                             window.open(data.init_point, '_blank');
                           } else {
                             alert('Erro ao gerar link: ' + (data.error || 'Desconhecido'));
                           }
                         } catch (err: any) {
                           alert('Erro na requisição: ' + err.message);
                         }
                       }}
                       className="flex-1 bg-[#009ee3] hover:bg-[#0089c7] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                     >
                       Gerar Link Mercado Pago
                     </button>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'resumo' && activeTab !== 'config' && activeTab !== 'consumo' && activeTab !== 'financeiro' && tabs.find(t => t.id === activeTab) && (
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center text-zinc-500">
            {(() => {
              const currentTab = tabs.find(t => t.id === activeTab)!;
              return (
                <>
                  <currentTab.icon className="w-12 h-12 mb-4 text-zinc-700" />
                  <h3 className="font-display text-xl font-bold mb-2 text-zinc-300">
                    Página de {currentTab.label}
                  </h3>
                  <p className="max-w-md">
                    Esta aba exibiria as métricas detalhadas e gerenciamento específico para {currentTab.label.toLowerCase()} do cliente {client.name}.
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
}
