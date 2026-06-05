import { useState, useEffect } from 'react';
import { 
  Database, HardDrive, Users, Zap, Globe, 
  CheckCircle2, AlertTriangle, XOctagon, Activity, Server, Clock, RefreshCw, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { collection, query, where, onSnapshot, getFirestore, updateDoc, doc } from 'firebase/firestore';
import { getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ClientData } from '../../types';
import { initializeApp, getApps } from 'firebase/app';

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Agora';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Agora';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // If the difference is negative or extremely small, treat as "Agora"
    if (diffMs < 30000) {
      return 'Agora';
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) {
      return 'Agora';
    }
    if (diffMins < 60) {
      return diffMins === 1 ? 'Há 1 minuto' : `Há ${diffMins} minutos`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? 'Há 1 hora' : `Há ${diffHours} horas`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return diffDays === 1 ? 'Há 1 dia' : `Há ${diffDays} dias`;
    }
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return diffMonths === 1 ? 'Há 1 mês' : `Há ${diffMonths} meses`;
    }
    
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? 'Há 1 ano' : `Há ${diffYears} anos`;
  } catch (e) {
    return 'Agora';
  }
};

type ServiceStatus = 'online' | 'warning' | 'critical';

export function MonitorView() {
  const [pulse, setPulse] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  
  const [realMetrics, setRealMetrics] = useState<({ label: string; count: number; readWeight: number; writeWeight: number })[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gcpMetrics, setGcpMetrics] = useState<any>(null);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any[] | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const [consoleData, setConsoleData] = useState({
     reads: 0,
     writes: 0,
     deletes: 0,
     realtime: 0,
     ruleEvaluations: 0,
     storage: 0
  });

  const getDivergence = (sys: number, fb: number) => {
     if (!fb || fb === 0) return 0;
     const div = (((sys - fb) / fb) * 100);
     return div;
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gcpDiagnostic, setGcpDiagnostic] = useState<any>(null);

  const [timeRange, setTimeRange] = useState<'30d' | '7d' | '1d' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [editingFirebase, setEditingFirebase] = useState(false);
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbConfig, setFbConfig] = useState('');
  const [fbDbName, setFbDbName] = useState('(default)');
  const [monitorCols, setMonitorCols] = useState<{ id: string; label: string; collectionPath: string; readWeight: number; writeWeight: number }[]>([]);

  const defaultMonitorCols = [
    { id: 'm1', label: 'Leads', collectionPath: 'leads', readWeight: 12, writeWeight: 2 },
    { id: 'm2', label: 'Clientes Ativos', collectionPath: 'clients', readWeight: 5, writeWeight: 1 },
    { id: 'm3', label: 'Transações', collectionPath: 'transactions', readWeight: 2, writeWeight: 1 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientData));
      setClients(data);
      if (data.length > 0 && !selectedClient) {
        setSelectedClient(data[0]);
      }
    });
    return () => unsubscribe();
  }, [selectedClient]);

  const runDiscovery = async () => {
    if (!selectedClient?.firebaseProjectId) {
      setErrorMsg("Cliente sem configurações de ID do Projeto para Discovery.");
      return;
    }
    setIsDiscovering(true);
    setDiscoveryResults(null);
    try {
      const url = `/api/gcp/discovery?projectId=${encodeURIComponent(selectedClient.firebaseProjectId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Falha na descoberta de métricas.");
      } else {
        setDiscoveryResults(data.metrics || []);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erro ao descobrir métricas.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const fetchClientMetrics = async () => {
    if (!selectedClient?.parsedFirebaseConfig && !selectedClient?.firebaseProjectId) {
       setRealMetrics([]);
       setGcpMetrics(null);
       setErrorMsg("Cliente sem configurações de projeto");
       return;
    }
    
    setIsRefreshing(true);
    setErrorMsg(null);
    setGcpDiagnostic(null);
    setGcpMetrics(null);

    let fetchedGcp = null;
    let fetchedReal: any[] = [];
    let currentError = null;

    // 1. Fetch GCP metrics if we have a Project ID
    if (selectedClient.firebaseProjectId) {
      try {
        let qs = `projectId=${encodeURIComponent(selectedClient.firebaseProjectId)}&clientName=${encodeURIComponent(selectedClient.name)}`;
        
        const now = new Date();
        let endD = now.toISOString();
        let startD = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        if (timeRange === 'custom' && customStart && customEnd) {
          startD = new Date(customStart).toISOString();
          const dEnd = new Date(customEnd);
          dEnd.setHours(23, 59, 59, 999);
          endD = dEnd.toISOString();
        } else if (timeRange === '7d') {
          startD = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (timeRange === '1d') {
          startD = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        qs += `&startDate=${encodeURIComponent(startD)}&endDate=${encodeURIComponent(endD)}`;

        const url = `/api/client-metrics-gcp?${qs}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
           currentError = data.error || "Falha ao buscar métricas GCP";
           setErrorMsg(currentError);
           if (data.diagnostic) {
             setGcpDiagnostic(data.diagnostic);
           }
        } else {
           fetchedGcp = data;
           setGcpMetrics(fetchedGcp);
        }
        
        // Fetch direct storage calculation as fallback/override for accurate size
        try {
           const durl = `/api/client-metrics-storage-direct?projectId=${encodeURIComponent(selectedClient.firebaseProjectId)}`;
           const dres = await fetch(durl);
           if (dres.ok) {
              const ddata = await dres.json();
              if (ddata.totalBytes !== undefined) {
                 if (!fetchedGcp) fetchedGcp = { cloudStorageBytesV2: { value: 0, metric: "" } };
                 fetchedGcp.cloudStorageBytesV2 = { value: ddata.totalBytes, metric: "direct: gcp-storage-api list files" };
                 setGcpMetrics({ ...fetchedGcp });
              }
           }
        } catch (e) {
           console.error("Direct storage fetch error:", e);
        }

      } catch (err: any) {
        console.error("GCP Fetch Error:", err);
        currentError = "Erro na conexão com API de métricas.";
        setErrorMsg(currentError);
      }
    }

    // 2. Fetch Volume from Client DB if configured
    if (selectedClient.parsedFirebaseConfig) {
      try {
        const appName = `monitor-${selectedClient.id}`;
        const app = getApps().find(a => a.name === appName) || initializeApp(selectedClient.parsedFirebaseConfig, appName);
        
        const dbName = selectedClient.firebaseDatabaseName && selectedClient.firebaseDatabaseName !== '(default)' 
          ? selectedClient.firebaseDatabaseName 
          : undefined;
        const clientDb = getFirestore(app, dbName);
        
        const colsToFetch = selectedClient.monitorCollections?.length ? selectedClient.monitorCollections : defaultMonitorCols;
        
        for (const col of colsToFetch) {
          let count = 0;
          try {
            const snap = await getCountFromServer(collection(clientDb, col.collectionPath));
            count = snap.data().count;
          } catch (e: any) {
            console.warn(`Error counting ${col.collectionPath}`, e);
          }
          fetchedReal.push({ 
            label: col.label, 
            count, 
            readWeight: col.readWeight, 
            writeWeight: col.writeWeight 
          });
        }

        setRealMetrics(fetchedReal);
      } catch (err: any) {
        console.error("Erro ao buscar volume do cliente:", err);
        setRealMetrics([]);
      }
    }

    if (selectedClient.id && !currentError) {
       try {
          await updateDoc(doc(db, "clients", selectedClient.id), {
             lastMetricsUpdate: new Date().toISOString(),
             lastGcpMetrics: fetchedGcp || null,
             lastRealMetrics: fetchedReal.length ? fetchedReal : null
          });
       } catch (err) {
          console.error("Erro ao salvar cache de metricas", err);
       }
    }
    
    setMetricsLoaded(true);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (selectedClient) {
      setFbProjectId(selectedClient.firebaseProjectId || '');
      setFbConfig(selectedClient.firebaseSdkConfig || '');
      setFbDbName(selectedClient.firebaseDatabaseName || '(default)');
      setMonitorCols(selectedClient.monitorCollections?.length ? selectedClient.monitorCollections : defaultMonitorCols);
      
      if (selectedClient.lastGcpMetrics || selectedClient.lastRealMetrics) {
        setGcpMetrics(selectedClient.lastGcpMetrics || null);
        setRealMetrics(selectedClient.lastRealMetrics || []);
        setMetricsLoaded(true);
      } else {
        setGcpMetrics(null);
        setRealMetrics([]);
        setMetricsLoaded(false);
      }
      
      setErrorMsg(null);
      setGcpDiagnostic(null);
      setEditingFirebase(false);
    }
  }, [selectedClient]);

  const handleAddMonitorCol = () => {
    setMonitorCols([...monitorCols, { id: Date.now().toString(), label: '', collectionPath: '', readWeight: 1, writeWeight: 1 }]);
  };

  const handleUpdateMonitorCol = (id: string, field: string, value: string | number) => {
    setMonitorCols(monitorCols.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveMonitorCol = (id: string) => {
    setMonitorCols(monitorCols.filter(c => c.id !== id));
  };

  const handleSaveFirebaseConfig = async () => {
    if (!selectedClient) return;
    
    let parsed = null;
    let finalProjectId = fbProjectId;

    if (fbConfig) {
      try {
        try {
          parsed = JSON.parse(fbConfig);
        } catch (e) {
          const match = fbConfig.match(/{\s*(?:['"]?apiKey['"]?\s*:[\s\S]+)\s*}/);
          if (match) {
            const getObj = new Function(`return ${match[0]}`);
            parsed = getObj();
          }
        }
        if (parsed && typeof parsed === 'object') {
          if (parsed.projectId && !finalProjectId) {
            finalProjectId = parsed.projectId;
          }
        }
      } catch (err) {
        console.warn('Could not parse SDK config', err);
      }
    }

    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        firebaseProjectId: finalProjectId,
        firebaseSdkConfig: fbConfig,
        firebaseDatabaseName: fbDbName,
        parsedFirebaseConfig: parsed || null,
        monitorCollections: monitorCols
      });
      setFbProjectId(finalProjectId);
      setEditingFirebase(false);
      // Wait a moment for onSnapshot to update selectedClient, then we can re-fetch
      setTimeout(() => fetchClientMetrics(), 500);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar configuração do Firebase');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* NOC Header */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between relative">
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-emerald-400 via-accent to-emerald-400 rounded-b"></div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center relative shrink-0 self-center">
            <Server className="w-6 sm:w-8 h-6 sm:h-8 text-accent relative z-10" />
            <div className={cn("absolute inset-0 bg-accent/20 rounded-2xl transition-opacity duration-1000", pulse ? "opacity-100" : "opacity-0")}></div>
          </div>
          <div className="text-center sm:text-left min-w-0">
             <div className="flex items-center gap-3 justify-center sm:justify-start">
               <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-100 leading-tight">Monitoramento de Consumo (NOC)</h2>
             </div>
             <p className="text-zinc-400 text-xs sm:text-sm mt-1 whitespace-normal">
               Status e limites em tempo real da infraestrutura dos clientes
             </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch xl:items-end gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 items-stretch sm:items-center w-full justify-start xl:justify-end">
              {/* Custom Client Selector (Anchored Overlay) */}
              <div className="relative w-full sm:w-52">
                <button
                  type="button"
                  onClick={() => {
                    setIsClientDropdownOpen(!isClientDropdownOpen);
                    setIsTimeDropdownOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-700 w-full cursor-pointer text-left select-none"
                >
                  <span className="truncate">{selectedClient?.name || 'Nenhum cliente...'}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isClientDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isClientDropdownOpen && (
                    <>
                      {/* Close overlay on click away */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsClientDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden p-anchored-overlay-enter-active max-h-60 overflow-y-auto"
                        style={{ transformOrigin: 'top' }}
                      >
                        {clients.length === 0 ? (
                          <div className="px-4 py-2.5 text-sm text-zinc-400 italic">Nenhum cliente...</div>
                        ) : (
                          clients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setSelectedClient(client);
                                setIsClientDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                selectedClient?.id === client.id 
                                  ? "text-accent font-semibold hover:bg-zinc-900/40" 
                                  : "text-zinc-300 hover:bg-zinc-900"
                              )}
                            >
                              <span className="truncate">{client.name}</span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Custom TimeRange Selector (Anchored Overlay) */}
              <div className="relative w-full sm:w-44">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimeDropdownOpen(!isTimeDropdownOpen);
                    setIsClientDropdownOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-700 cursor-pointer text-left select-none w-full"
                >
                  <span className="truncate text-left block w-full">
                    {timeRange === '30d' ? 'Últimos 30 Dias' :
                     timeRange === '7d' ? 'Últimos 7 Dias' :
                     timeRange === '1d' ? 'Últimas 24h' : 'Personalizado'}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isTimeDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isTimeDropdownOpen && (
                    <>
                      {/* Close overlay on click away */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsTimeDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute left-0 sm:left-auto sm:right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden w-full sm:min-w-[170px] p-anchored-overlay-enter-active"
                        style={{ transformOrigin: 'top' }}
                      >
                        {[
                          { val: '30d', label: 'Últimos 30 Dias' },
                          { val: '7d', label: 'Últimos 7 Dias' },
                          { val: '1d', label: 'Últimas 24h' },
                          { val: 'custom', label: 'Personalizado' }
                        ].map(item => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setTimeRange(item.val as any);
                              setIsTimeDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                              timeRange === item.val
                                ? "text-accent font-semibold hover:bg-zinc-900/40"
                                : "text-zinc-300 hover:bg-zinc-900"
                            )}
                          >
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                 type="button"
                 onClick={fetchClientMetrics}
                 disabled={isRefreshing || (!selectedClient?.firebaseProjectId && !selectedClient?.parsedFirebaseConfig)}
                 className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#97fb2e] hover:bg-[#85df29] text-[#0a1007] rounded-xl transition-all shadow-[0_0_20px_rgba(151,251,46,0.15)] disabled:opacity-50 cursor-pointer w-full sm:w-auto shrink-0"
               >
                 <RefreshCw className={cn("w-4 h-4 shrink-0", isRefreshing && "animate-spin")} />
                 <span>Atualizar</span>
               </button>
          </div>
          
          {timeRange === 'custom' && (
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1 w-full justify-end">
                <input 
                   type="date"
                   value={customStart}
                   onChange={(e) => setCustomStart(e.target.value)}
                   className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-700 w-full sm:w-auto"
                   style={{ colorScheme: 'dark' }}
                />
                <span className="text-zinc-500 text-xs text-center">até</span>
                <input 
                   type="date"
                   value={customEnd}
                   onChange={(e) => setCustomEnd(e.target.value)}
                   className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-700 w-full sm:w-auto"
                   style={{ colorScheme: 'dark' }}
                />
             </div>
          )}
        </div>
      </div>

      {/* Cards de Status do Topo (NOC Hub Widgets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Status Geral */}
        <div className="bg-[#101112] border border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Status Geral</span>
          <div className="flex items-center gap-2 text-[#97fb2e] font-extrabold text-lg sm:text-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-[#97fb2e] animate-pulse shrink-0"></span>
            Operacional
          </div>
        </div>

        {/* Card 2: Última Checagem */}
        <div className="bg-[#101112] border border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Última checagem</span>
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm sm:text-base" title={selectedClient?.lastMetricsUpdate ? new Date(selectedClient.lastMetricsUpdate).toLocaleString('pt-BR') : undefined}>
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              {selectedClient?.lastMetricsUpdate ? formatRelativeTime(selectedClient.lastMetricsUpdate) : 'Agora'}
            </span>
          </div>
        </div>

        {/* Card 3: Plano Contratado */}
        <div className="bg-[#101112] border border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Plano Contratado</span>
          <div className="flex items-center gap-2 text-white font-extrabold text-lg sm:text-xl">
            <Zap className="w-4 h-4 text-[#97fb2e] shrink-0" />
            <span className="truncate">{selectedClient?.plan || 'Starter'}</span>
          </div>
        </div>

        {/* Card 4: Cliente / Projeto Selecionado */}
        <div className="bg-[#101112] border border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Ambiente Ativo</span>
          <div className="text-accent font-extrabold text-sm sm:text-base truncate" title={selectedClient?.name || 'Não selecionado'}>
            {selectedClient?.name ? selectedClient.name : 'Nenhum'}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col">
        
        {/* Consumo de Cotas Limits */}
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="font-display text-lg font-bold flex items-center gap-2 text-white">
                 <Zap className="w-5 h-5 text-accent shrink-0" />
                 <span>Métricas do Google Cloud Monitoring</span>
              </h3>
              {selectedClient?.firebaseProjectId && gcpMetrics && (
                 <div className="flex flex-wrap gap-2">
                   <button 
                     type="button"
                     onClick={runDiscovery}
                     disabled={isDiscovering}
                     className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                   >
                      {isDiscovering ? "Buscando..." : "Descobrir Métricas Firestore"}
                   </button>
                   <button 
                     type="button"
                     onClick={() => setDebugMode(!debugMode)}
                     className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer", debugMode ? "bg-accent/20 border-accent/30 text-accent" : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200")}
                   >
                      Modo Debug {debugMode ? "ON" : "OFF"}
                   </button>
                 </div>
              )}
           </div>

            {!selectedClient?.firebaseProjectId ? (
               <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm py-8">
                 Cliente não possui ID de Projeto configurado.
               </div>
            ) : !gcpMetrics ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm py-8">
                  {isRefreshing ? "Buscando métricas via GCP..." : "Clique em 'Atualizar Métricas' para buscar dados reais do GCP."}
                </div>
            ) : (
                <div className="space-y-4">

                  {discoveryResults && (
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl col-span-full overflow-x-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-500" /> Métricas Descobertas
                        </h3>
                        <button type="button" onClick={() => setDiscoveryResults(null)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                          <XOctagon className="w-4 h-4" />
                        </button>
                      </div>
                      <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
                          <tr>
                            <th className="p-3 whitespace-nowrap">metric.type</th>
                            <th className="p-3 whitespace-nowrap">displayName</th>
                            <th className="p-3">description</th>
                            <th className="p-3 whitespace-nowrap">unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {discoveryResults.map((m: any, i: number) => (
                            <tr key={i} className="hover:bg-zinc-900/50">
                              <td className="p-3 font-mono text-xs break-words break-all text-emerald-400">{m.type}</td>
                              <td className="p-3 font-medium whitespace-nowrap">{m.displayName}</td>
                              <td className="p-3 text-zinc-500 text-xs min-w-[300px]">{m.description}</td>
                              <td className="p-3 font-mono text-xs text-zinc-400">{m.unit}</td>
                            </tr>
                          ))}
                          {discoveryResults.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-zinc-500">Nenhuma métrica encontrada com esse filtro.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!discoveryResults && [
                    { label: "Leituras", key: "reads_billable", data: gcpMetrics.reads_billable?.value > 0 ? gcpMetrics.reads_billable : gcpMetrics.reads_ops, costPer100k: 0.036, freeTier: 50000, suffix: " / dia" },
                    { label: "Gravações", key: "writes_billable", data: gcpMetrics.writes_billable?.value > 0 ? gcpMetrics.writes_billable : gcpMetrics.writes_ops, costPer100k: 0.108, freeTier: 20000, suffix: " / dia" },
                    { label: "Leituras em tempo real", key: "realtime_billable", data: gcpMetrics.realtime_billable?.value > 0 ? gcpMetrics.realtime_billable : gcpMetrics.realtime, costPer100k: 0, freeTier: 50000, suffix: " / dia" }
                  ].map((item, idx) => {
                    const debugInfo = gcpMetrics.debug?.find((d: any) => d.metricName === item.key);
                    const val = item.data?.value || 0;
                    
                    const valAfterFreeTier = Math.max(0, val - item.freeTier);
                    const USD_TO_BRL = 5.20;
                    const estimatedCostUSD = item.costPer100k > 0 ? (valAfterFreeTier / 100000) * item.costPer100k : 0;
                    const estimatedCostBRL = estimatedCostUSD * USD_TO_BRL;
                    
                    const progressPercent = item.freeTier > 0 ? Math.min(100, (val / item.freeTier) * 100) : 0;
                    const isOverLimit = item.freeTier > 0 ? val > item.freeTier : false;
                    
                    let progressColorClass = "from-emerald-500 to-emerald-400";
                    if (progressPercent > 50 && progressPercent <= 80) {
                      progressColorClass = "from-yellow-500 to-yellow-400";
                    } else if (progressPercent > 80 || isOverLimit) {
                      progressColorClass = "from-rose-500 to-rose-400";
                    }
                    
                    return (
                    <div key={idx} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                      <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="font-medium text-sm text-zinc-300">{item.label}</span>
                             {item.freeTier > 0 && (
                               <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Isento até {item.freeTier.toLocaleString()}{item.suffix}</span>
                             )}
                          </div>
                          <span className="font-bold text-lg text-zinc-100">
                            {val.toLocaleString()}
                          </span>
                      </div>
                      
                      {debugMode && (
                        <div className="text-xs text-zinc-600 font-mono break-all mb-3">{item.data?.metric}</div>
                      )}

                      {item.freeTier > 0 && (
                         <div className="w-full bg-zinc-900 rounded-full h-3 mb-4 overflow-hidden border border-zinc-800 relative mt-2">
                            <div 
                              className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                              style={{ width: progressPercent + '%' }}
                            />
                         </div>
                      )}

                      {item.costPer100k > 0 && (
                         <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500">Estimativa de consumo:</span>
                            {estimatedCostBRL > 0 ? (
                               <span className="text-emerald-400 font-medium">~R$ {estimatedCostBRL.toFixed(4)} BRL</span>
                            ) : (
                               <span className="text-zinc-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">Dentro do limite gratuito</span>
                            )}
                         </div>
                      )}
                      
                      {item.key === 'realtime text-zinc-500' && (
                         <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500">Estimativa de consumo:</span>
                            <span className="text-emerald-400 font-medium font-mono">Incluído nas Leituras</span>
                         </div>
                      )}

                      {debugMode && debugInfo && (
                          <div className="mt-3 p-3 bg-black/40 rounded border border-zinc-900 overflow-x-auto text-xs text-zinc-400 font-mono space-y-1">
                             <div className="text-emerald-500 font-bold mb-2">=== {item.label} ===</div>
                             <div><span className="text-zinc-500">Nome da métrica:</span> {debugInfo.metricName}</div>
                             <div><span className="text-zinc-500">Filtro utilizado:</span> {debugInfo.request?.filter}</div>
                             <div><span className="text-zinc-500">Quant. de Séries:</span> {debugInfo.returnedSeriesCount}</div>
                             <div><span className="text-zinc-500">Séries Agregadas/Pontos:</span> {debugInfo.rawPoints} pt(s)</div>
                             <div><span className="text-zinc-500">Valor Bruto Retornado:</span> {debugInfo.returnedValue}</div>
                             <div><span className="text-zinc-500">Valor Agregado (UI):</span> {item.data?.value}</div>
                             <div><span className="text-zinc-500">Janela Consultada:</span> {new Date(debugInfo.request?.interval?.startTime?.seconds * 1000).toLocaleDateString()} a {new Date(debugInfo.request?.interval?.endTime?.seconds * 1000).toLocaleDateString()}</div>
                             <div><span className="text-zinc-500">Tempo de Consulta:</span> {debugInfo.queryTimeMs} ms</div>
                          </div>
                      )}
                    </div>
                  )})}

                  {!discoveryResults && (() => {
                     const storageValGB = (gcpMetrics.storageBytes?.value || 0) / 1024 / 1024 / 1024;
                     const storageAfterFreeTier = Math.max(0, storageValGB - 1); // 1GB isento
                     const USD_TO_BRL = 5.20;
                     const storageCostUSD = storageAfterFreeTier * 0.108;
                     const storageCostBRL = storageCostUSD * USD_TO_BRL;
                     
                     const progressPercent = Math.min(100, (storageValGB / 1) * 100);
                     const isOverLimit = storageValGB > 1;
                     
                     let progressColorClass = "from-emerald-500 to-emerald-400";
                     if (progressPercent > 50 && progressPercent <= 80) {
                       progressColorClass = "from-yellow-500 to-yellow-400";
                     } else if (progressPercent > 80 || isOverLimit) {
                       progressColorClass = "from-rose-500 to-rose-400";
                     }
                     
                     return (
                     <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mt-4">
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="text-zinc-300 font-medium text-sm">Armazenamento do Banco (Firestore)</span>
                             <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Isento até 1 GB</span>
                          </div>
                          <span className="text-zinc-100 font-bold">
                            {(gcpMetrics.storageBytes?.value / 1024 / 1024).toFixed(2)} MB 
                            {gcpMetrics.storageBytes?.value > 0 && <span className="font-normal text-zinc-500 ml-2">({storageValGB.toFixed(4)} GB)</span>}
                          </span>
                       </div>
                       
                       {debugMode && (
                         <div className="text-xs text-zinc-600 font-mono break-all mb-3">{gcpMetrics.storageBytes?.metric || 'metric.type="firestore.googleapis.com/storage/data_and_index_storage_bytes"'}</div>
                       )}

                       <div className="w-full bg-zinc-900 rounded-full h-3 mb-4 overflow-hidden border border-zinc-800 relative mt-2">
                          <div 
                            className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                            style={{ width: progressPercent + '%' }}
                          />
                       </div>

                       <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                             <span className="text-zinc-500">Estimativa de consumo:</span>
                             {storageCostBRL > 0 ? (
                                <span className="text-emerald-400 font-medium font-mono">~R$ {storageCostBRL.toFixed(4)} BRL / mês</span>
                             ) : (
                                <span className="text-zinc-400 font-medium font-mono">Dentro do limite gratuito</span>
                             )}
                       </div>
                     </div>
                     );
                  })()}

                  {!discoveryResults && (() => {
                     const val1 = gcpMetrics.cloudStorageBytes?.value || 0;
                     const val2 = gcpMetrics.cloudStorageBytesV2?.value || 0;
                     const finalStorageValue = Math.max(val1, val2);
                     const activeMetricName = val2 > val1 ? gcpMetrics.cloudStorageBytesV2?.metric : gcpMetrics.cloudStorageBytes?.metric;
                     
                     const cloudStorageValGB = finalStorageValue / 1024 / 1024 / 1024;
                     const cloudStorageAfterFreeTier = Math.max(0, cloudStorageValGB - 5); // 5GB isento
                     const USD_TO_BRL = 5.20;
                     const cloudStorageCostUSD = cloudStorageAfterFreeTier * 0.026; // Approx price for standard storage
                     const cloudStorageCostBRL = cloudStorageCostUSD * USD_TO_BRL;
                     
                     const progressPercent = Math.min(100, (cloudStorageValGB / 5) * 100);
                     const isOverLimit = cloudStorageValGB > 5;
                     
                     let progressColorClass = "from-emerald-500 to-emerald-400";
                     if (progressPercent > 50 && progressPercent <= 80) {
                       progressColorClass = "from-yellow-500 to-yellow-400";
                     } else if (progressPercent > 80 || isOverLimit) {
                       progressColorClass = "from-rose-500 to-rose-400";
                     }
                     
                     return (
                     <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mt-4">
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="text-zinc-300 font-medium text-sm">Armazenamento de Arquivos (Storage)</span>
                             <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Isento até 5 GB</span>
                          </div>
                          <span className="text-zinc-100 font-bold">
                            {(finalStorageValue / 1024 / 1024).toFixed(2)} MB 
                            {finalStorageValue > 0 && <span className="font-normal text-zinc-500 ml-2">({cloudStorageValGB.toFixed(4)} GB)</span>}
                          </span>
                       </div>
                       
                       {debugMode && (
                         <div className="text-xs text-zinc-600 font-mono break-all mb-3">{activeMetricName || 'metric.type="storage.googleapis.com/storage/total_bytes"'}</div>
                       )}

                       <div className="w-full bg-zinc-900 rounded-full h-3 mb-4 overflow-hidden border border-zinc-800 relative mt-2">
                          <div 
                            className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                            style={{ width: progressPercent + '%' }}
                          />
                       </div>

                       <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                             <span className="text-zinc-500">Estimativa de consumo:</span>
                             {cloudStorageCostBRL > 0 ? (
                                <span className="text-emerald-400 font-medium font-mono font-mono">~R$ {cloudStorageCostBRL.toFixed(4)} BRL / mês</span>
                             ) : (
                                <span className="text-zinc-400 font-medium font-mono font-mono">Dentro do limite gratuito</span>
                             )}
                       </div>
                     </div>
                     );
                  })()}

                  <div className="pt-4 mt-2 border-t border-zinc-800">
                    <div className="flex justify-between text-xs text-zinc-500">
                       <span>Última atualização (Timestamp)</span>
                       <span>{new Date(gcpMetrics.lastUpdated).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
            )}
        </div>

      </div>

      {selectedClient && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="font-display text-lg font-bold flex items-center gap-2 text-white min-w-0">
              <Server className="w-5 h-5 text-accent shrink-0" />
              <span className="truncate">Configuração do Banco de Dados ({selectedClient.name})</span>
            </h3>
            {!editingFirebase ? (
              <button 
                type="button"
                onClick={() => setEditingFirebase(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Editar Configuração
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setEditingFirebase(false)}
                  className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveFirebaseConfig}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-black text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>

          {editingFirebase ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-1 block">ID do Projeto</label>
                  <input 
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent font-mono"
                    placeholder="meu-projeto-123"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-1 block">Nome do DB</label>
                  <input 
                    value={fbDbName}
                    onChange={(e) => setFbDbName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent font-mono"
                    placeholder="(default)"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-1 block">Configuração SDK (JSON/JS)</label>
                  <textarea 
                    value={fbConfig}
                    onChange={(e) => setFbConfig(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-accent font-mono h-32 resize-none text-xs mb-2"
                    placeholder="Cole aqui a configuração..."
                  />
                </div>
                
                <div className="bg-zinc-950/50 p-4 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-400 block">Coleções para Monitorar (Volume Real)</label>
                    <button type="button" onClick={handleAddMonitorCol} className="text-xs text-accent hover:underline cursor-pointer">
                      + Adicionar Coleção
                    </button>
                  </div>
                  {monitorCols.length === 0 ? (
                     <div className="text-xs text-zinc-600 italic">Usando configurações padrão (Leads, Clientes, Transações).</div>
                  ) : (
                     <div className="space-y-3">
                       {monitorCols.map((c, idx) => (
                         <div key={c.id} className="grid grid-cols-[1fr,1fr,50px,50px,20px] gap-2 items-center">
                            <input 
                              value={c.label} 
                              onChange={e => handleUpdateMonitorCol(c.id, 'label', e.target.value)} 
                              placeholder="Nome Exibição" 
                              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs" 
                            />
                            <input 
                              value={c.collectionPath} 
                              onChange={e => handleUpdateMonitorCol(c.id, 'collectionPath', e.target.value)} 
                              placeholder="Coleção" 
                              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono" 
                            />
                            <input 
                              type="number"
                              title="Peso Leituras (Multiplicador)"
                              value={c.readWeight} 
                              onChange={e => handleUpdateMonitorCol(c.id, 'readWeight', Number(e.target.value))} 
                              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-center" 
                            />
                            <input 
                              type="number"
                              title="Peso Gravações (Multiplicador)"
                              value={c.writeWeight} 
                              onChange={e => handleUpdateMonitorCol(c.id, 'writeWeight', Number(e.target.value))} 
                              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-center" 
                            />
                            <button type="button" onClick={() => handleRemoveMonitorCol(c.id)} className="text-rose-500 hover:text-rose-400 cursor-pointer">
                              <XOctagon className="w-3 h-3" />
                            </button>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">Project ID</span>
                <span className="text-zinc-200 font-mono text-sm break-all">{selectedClient.firebaseProjectId || 'Não configurado'}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">Database Name</span>
                <span className="text-zinc-200 font-mono text-sm break-all">{selectedClient.firebaseDatabaseName || '(default)'}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">Status SDK</span>
                <span className="text-zinc-200 text-sm flex items-center gap-2 mt-1">
                  {selectedClient.parsedFirebaseConfig ? (
                    <><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> Configurado</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> Pendente</>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Relatório Comparativo (Administrativo) */}
      {selectedClient && gcpMetrics && !editingFirebase && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col mt-6">
            <h3 className="font-display text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-accent" />
              Relatório Comparativo (Administrativo)
            </h3>
            <p className="text-zinc-400 text-sm mb-6">Compare os números do painel Uso do Firebase com as métricas extraídas via Cloud Monitoring (AnymaSystem) para verificar a divergência. Insira os valores manuais do Firebase abaixo:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold">Métrica</th>
                    <th className="p-3 w-48 font-semibold">Firebase Console (30 dias)</th>
                    <th className="p-3 w-48 font-semibold">AnymaSystem (API)</th>
                    <th className="p-3 w-32 font-semibold">Divergência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {[
                    { label: "Leituras", key: "reads", sysVal: (gcpMetrics.reads_billable?.value > 0 ? gcpMetrics.reads_billable.value : gcpMetrics.reads_ops?.value) || 0 },
                    { label: "Gravações", key: "writes", sysVal: (gcpMetrics.writes_billable?.value > 0 ? gcpMetrics.writes_billable.value : gcpMetrics.writes_ops?.value) || 0 },
                    { label: "Leituras Realtime", key: "realtime", sysVal: (gcpMetrics.realtime_billable?.value > 0 ? gcpMetrics.realtime_billable.value : gcpMetrics.realtime?.value) || 0 },
                    { label: "Firestore (MB)", key: "storage", sysVal: (gcpMetrics.storageBytes?.value / 1024 / 1024) || 0 },
                    { label: "Storage Arquivos (MB)", key: "cloud_storage", sysVal: (Math.max(gcpMetrics.cloudStorageBytes?.value || 0, gcpMetrics.cloudStorageBytesV2?.value || 0) / 1024 / 1024) || 0 }
                  ].map((row, idx) => {
                    const fbVal = (consoleData as any)[row.key];
                    const div = getDivergence(row.sysVal, fbVal);
                    const divColor = Math.abs(div) < 5 ? 'text-emerald-400' : Math.abs(div) < 15 ? 'text-amber-400' : 'text-rose-400';
                    return (
                    <tr key={idx} className="hover:bg-zinc-800/20">
                      <td className="p-3 font-sans font-medium text-zinc-200">{row.label}</td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          value={fbVal || ''} 
                          onChange={e => setConsoleData(prev => ({ ...prev, [row.key]: Number(e.target.value) }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 outline-none focus:border-accent text-right"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-3 text-right">{row.sysVal > 0 && row.key !== 'storage' ? row.sysVal.toLocaleString() : row.key === 'storage' ? row.sysVal.toFixed(2) : '0'}</td>
                      <td className={cn("p-3 text-right font-bold", divColor)}>
                         {fbVal > 0 ? (div > 0 ? `+${div.toFixed(1)}%` : `${div.toFixed(1)}%`) : '-'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

        </div>
      )}

    </div>
  );
}
