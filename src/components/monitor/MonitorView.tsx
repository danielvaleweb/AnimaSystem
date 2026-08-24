import { useState, useEffect } from 'react';
import { useNotification } from '../NotificationContext';
import { 
  Database, HardDrive, Users, Zap, Globe, 
  CheckCircle2, AlertTriangle, XOctagon, Activity, Server, Clock, RefreshCw, Rocket, Hand, Power, Code, ChevronDown,
  Upload, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { collection, query, where, onSnapshot, getFirestore, updateDoc, doc, getDoc } from 'firebase/firestore';
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

export function MonitorView({ onNavigate }: { onNavigate?: (v: any, id?: string) => void }) {
  const { showSuccess } = useNotification();
  const [pulse, setPulse] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || null;
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  
  const [realMetrics, setRealMetrics] = useState<({ label: string; count: number; readWeight: number; writeWeight: number })[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gcpMetrics, setGcpMetrics] = useState<any>(null);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any[] | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [bqProjectId, setBqProjectId] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('bqProjectId') || '') : '');
  const [bqDatasetId, setBqDatasetId] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('bqDatasetId') || '') : '');
  const [bqTableId, setBqTableId] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('bqTableId') || '') : '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bqProjectId', bqProjectId);
    }
  }, [bqProjectId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bqDatasetId', bqDatasetId);
    }
  }, [bqDatasetId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bqTableId', bqTableId);
    }
  }, [bqTableId]);
  const [isBqSyncing, setIsBqSyncing] = useState(false);
  const [bqError, setBqError] = useState('');
  const [bqResult, setBqResult] = useState<any>(null);

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

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [parsedCsvRecords, setParsedCsvRecords] = useState<{ projectName: string; projectId: string; cost: number; originalCostString: string; matchedClientId?: string; matchedClientName?: string }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvPeriod, setCsvPeriod] = useState("");
  const [csvSuccessCount, setCsvSuccessCount] = useState<number | null>(null);

  // BigQuery automated sync states
  const [billingSyncTab, setBillingSyncTab] = useState<'csv' | 'bigquery'>('csv');


  const [timeRange, setTimeRange] = useState<'30d' | '7d' | '1d' | 'custom'>('1d');
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
    const loadGlobalSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.bqProjectId) {
            setBqProjectId(data.bqProjectId);
            if (typeof window !== 'undefined') localStorage.setItem('bqProjectId', data.bqProjectId);
          }
          if (data.bqDatasetId) {
            setBqDatasetId(data.bqDatasetId);
            if (typeof window !== 'undefined') localStorage.setItem('bqDatasetId', data.bqDatasetId);
          }
          if (data.bqTableId) {
            setBqTableId(data.bqTableId);
            if (typeof window !== 'undefined') localStorage.setItem('bqTableId', data.bqTableId);
          }
        }
      } catch (err) {
        console.warn("Error loading global settings in MonitorView:", err);
      }
    };
    loadGlobalSettings();
  }, []);

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
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);


  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'ended' | 'trial' | 'developing') => {
    if (!selectedClient) return;
    if (newStatus === 'trial') {
      setIsTrialModalOpen(true);
      setIsStatusDropdownOpen(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        status: newStatus,
        trialEndDate: null
      });
      setIsStatusDropdownOpen(false);
    } catch (err) {
      console.error("Error updating client status:", err);
      setErrorMsg("Erro ao atualizar status do cliente.");
    }
  };

  const handleConfirmTrial = async () => {
    if (!selectedClient || !trialEndDate) return;
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), { status: 'trial', trialEndDate });
      setIsTrialModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao atualizar status para trial.');
    }
  };

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

    // Sync BigQuery billing data first (financeiro)
    try {
      const bqP = bqProjectId || (typeof window !== 'undefined' ? localStorage.getItem('bqProjectId') : '') || '';
      const bqD = bqDatasetId || (typeof window !== 'undefined' ? localStorage.getItem('bqDatasetId') : '') || '';
      const bqT = bqTableId || (typeof window !== 'undefined' ? localStorage.getItem('bqTableId') : '') || '';
      
      const qs = bqP && bqD && bqT ? `?bqProjectId=${encodeURIComponent(bqP)}&bqDatasetId=${encodeURIComponent(bqD)}&bqTableId=${encodeURIComponent(bqT)}` : '';
      const url = `/api/gcp/billing-sync-bigquery${qs}`;
      const bqRes = await fetch(url);
      if (bqRes.ok) {
        const bqData = await bqRes.json();
        if (bqData?.details?.length && selectedClient) {
          const match = bqData.details.find((d: any) => 
            (selectedClient.firebaseProjectId && d.projectId?.trim().toLowerCase() === selectedClient.firebaseProjectId?.trim().toLowerCase()) ||
            (selectedClient.name && d.clientName?.trim().toLowerCase() === selectedClient.name?.trim().toLowerCase()) ||
            d.clientId === selectedClient.id
          );
          if (match && match.costBRL !== undefined) {
            setClients(prev => prev.map(c => c.id === selectedClient.id ? { 
              ...c, 
              gcpBillingCost: match.costBRL,
              gcpBillingLastSync: new Date().toISOString()
            } : c));
          }
        }
      }
    } catch (err) {
      console.error("Erro na sincronização BQ:", err);
    }

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
          showSuccess('Atualização Concluída', 'Métricas e faturamento sincronizados com sucesso.');
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

  const calculateTotalCost = () => {
    if (!gcpMetrics) return { currentBRL: 0, projectedBRL: 0 };
    
    const USD_TO_BRL = 5.45;
    const currentDay = Math.max(1, new Date().getDate());
    
    // Reads (Free tier: 50K per day = 50K * currentDay)
    const readsVal = gcpMetrics.reads_billable?.value || gcpMetrics.reads_ops?.value || 0;
    const readsAfterFree = Math.max(0, readsVal - (50000 * currentDay));
    const readsCostUSD = (readsAfterFree / 100000) * 0.036;
    
    // Writes (Free tier: 20K per day = 20K * currentDay)
    const writesVal = gcpMetrics.writes_billable?.value || gcpMetrics.writes_ops?.value || 0;
    const writesAfterFree = Math.max(0, writesVal - (20000 * currentDay));
    const writesCostUSD = (writesAfterFree / 100000) * 0.108;
    
    // Firestore Storage (Free tier: 1 GB per month)
    const fsStorageGB = (gcpMetrics.storageBytes?.value || 0) / 1024 / 1024 / 1024;
    const fsStorageAfterFree = Math.max(0, fsStorageGB - 1);
    const fsStorageCostUSD = fsStorageAfterFree * 0.108;
    
    // Cloud Storage (Free tier: 5 GB per month)
    const csVal1 = gcpMetrics.cloudStorageBytes?.value || 0;
    const csVal2 = gcpMetrics.cloudStorageBytesV2?.value || 0;
    const csFinalVal = Math.max(csVal1, csVal2);
    const csStorageGB = csFinalVal / 1024 / 1024 / 1024;
    const csStorageAfterFree = Math.max(0, csStorageGB - 5);
    const csStorageCostUSD = csStorageAfterFree * 0.026;
    
    const currentUSD = readsCostUSD + writesCostUSD + fsStorageCostUSD + csStorageCostUSD;
    const currentBRL = currentUSD * USD_TO_BRL;
    
    // Project 30 days based on the selected timeRange
    let multiplier = 1;
    if (timeRange === '7d') multiplier = 30 / 7;
    else if (timeRange === '1d') multiplier = 30;
    
    const projectedBRL = currentBRL * multiplier;
    
    return {
      currentBRL,
      projectedBRL: Math.max(currentBRL, projectedBRL)
    };
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setParsedCsvRecords([]);
    setCsvSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          setCsvError("Arquivo vazio.");
          return;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setCsvError("O arquivo CSV precisa conter pelo menos um cabeçalho e uma linha de dados.");
          return;
        }

        // Parse header row to find column indexes
        const header = lines[0].split(/[;,\t]/).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        
        // Find project ID column
        let projectIdIdx = header.findIndex(h => h.includes('id do projeto') || h.includes('project id') || h.includes('id_projeto') || h.includes('project_id'));
        // Find project name column
        let projectNameIdx = header.findIndex(h => h.includes('projeto') || h.includes('project') || h.includes('nome_projeto'));
        // Find cost column (Subtotal, Custo de uso, Total, Cost)
        let costIdx = header.findIndex(h => h.includes('custo de uso') || h.includes('subtotal') || h.includes('total') || h.includes('custo') || h.includes('cost') || h.includes('uso') || h.includes('valor'));

        // Fallbacks for standard GCP billing exports
        if (projectIdIdx === -1) {
          projectIdIdx = header.findIndex(h => h.includes('id') || h.includes('project'));
        }
        if (projectNameIdx === -1) {
          projectNameIdx = 0; // standard first column is name
        }
        if (costIdx === -1) {
          costIdx = header.findIndex(h => h.includes('custo') || h.includes('total') || h.includes('subtotal') || h.includes('valor'));
        }

        if (projectIdIdx === -1 || costIdx === -1) {
          setCsvError(`Não foi possível mapear as colunas obrigatórias automaticamente. Cabeçalhos encontrados: [${header.slice(0, 5).join(', ')}...]. Certifique-se de exportar o relatório de faturamento agrupado por 'Projeto' com a coluna 'ID do projeto'.`);
          return;
        }

        const records: typeof parsedCsvRecords = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          let cols: string[] = [];
          const line = lines[i];
          
          const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
          
          let insideQuotes = false;
          let currentField = '';
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"' || char === "'") {
              insideQuotes = !insideQuotes;
            } else if (char === separator && !insideQuotes) {
              cols.push(currentField.trim().replace(/^["']|["']$/g, ''));
              currentField = '';
            } else {
              currentField += char;
            }
          }
          cols.push(currentField.trim().replace(/^["']|["']$/g, ''));

          if (cols.length <= Math.max(projectIdIdx, costIdx)) continue;

          const rawProjectId = cols[projectIdIdx] || '';
          const rawProjectName = cols[projectNameIdx] || '';
          const rawCost = cols[costIdx] || '';

          if (!rawProjectId) continue;

          // Clean cost string (e.g. "R$ 0,08" -> 0.08)
          let cleanCostStr = rawCost.replace(/R\$/g, '').replace(/\$/g, '').replace(/\s/g, '');
          if (cleanCostStr.includes(',') && !cleanCostStr.includes('.')) {
            cleanCostStr = cleanCostStr.replace(',', '.');
          } else if (cleanCostStr.includes('.') && cleanCostStr.includes(',')) {
            cleanCostStr = cleanCostStr.replace(/\./g, '').replace(',', '.');
          }
          
          const costVal = parseFloat(cleanCostStr);
          if (isNaN(costVal)) continue;

          // Attempt to match with local client
          const matchedClient = clients.find(c => 
            c.firebaseProjectId?.trim().toLowerCase() === rawProjectId.trim().toLowerCase() ||
            c.name?.trim().toLowerCase() === rawProjectName.trim().toLowerCase()
          );

          records.push({
            projectName: rawProjectName,
            projectId: rawProjectId,
            cost: costVal,
            originalCostString: rawCost,
            matchedClientId: matchedClient?.id,
            matchedClientName: matchedClient?.name
          });
        }

        if (records.length === 0) {
          setCsvError("Nenhuma linha de cobrança válida pôde ser extraída do arquivo.");
        } else {
          setParsedCsvRecords(records);
        }
      } catch (err: any) {
        console.error(err);
        setCsvError("Erro desconhecido ao processar o arquivo CSV.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const confirmCsvSync = async () => {
    if (parsedCsvRecords.length === 0) return;
    
    let count = 0;
    for (const record of parsedCsvRecords) {
      if (record.matchedClientId) {
        try {
          await updateDoc(doc(db, 'clients', record.matchedClientId), {
            gcpBillingCost: record.cost,
            gcpBillingPeriod: csvPeriod || 'Mês atual',
            gcpBillingLastSync: new Date().toISOString()
          });
          count++;
        } catch (err) {
          console.error(`Erro ao sincronizar cliente ${record.matchedClientName}:`, err);
        }
      }
    }
    setCsvSuccessCount(count);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setParsedCsvRecords([]);
      setCsvSuccessCount(null);
      setCsvPeriod("");
    }, 3000);
  };

  const handleBqSync = async () => {
    const bqP = bqProjectId || (typeof window !== 'undefined' ? localStorage.getItem('bqProjectId') : '') || '';
    const bqD = bqDatasetId || (typeof window !== 'undefined' ? localStorage.getItem('bqDatasetId') : '') || '';
    const bqT = bqTableId || (typeof window !== 'undefined' ? localStorage.getItem('bqTableId') : '') || '';

    setIsBqSyncing(true);
    setBqError('');
    try {
      const qs = bqP && bqD && bqT ? `?bqProjectId=${encodeURIComponent(bqP)}&bqDatasetId=${encodeURIComponent(bqD)}&bqTableId=${encodeURIComponent(bqT)}` : '';
      const url = `/api/gcp/billing-sync-bigquery${qs}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.details || 'Falha ao consultar BigQuery.');
      }
      const result = await res.json();
      setBqResult(result);

      if (result?.details?.length && selectedClient) {
        const match = result.details.find((d: any) => 
          (selectedClient.firebaseProjectId && d.projectId?.trim().toLowerCase() === selectedClient.firebaseProjectId?.trim().toLowerCase()) ||
          (selectedClient.name && d.clientName?.trim().toLowerCase() === selectedClient.name?.trim().toLowerCase()) ||
          d.clientId === selectedClient.id
        );
        if (match && match.costBRL !== undefined) {
          setClients(prev => prev.map(c => c.id === selectedClient.id ? { 
            ...c, 
            gcpBillingCost: match.costBRL,
            gcpBillingLastSync: new Date().toISOString()
          } : c));
        }
      }
    } catch (err: any) {
      setBqError(err.message || 'Erro ao sincronizar com BigQuery.');
    } finally {
      setIsBqSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-14">
      
      {/* Greeting Row Pattern */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-5 text-left">
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight whitespace-nowrap">
              Monitoramento
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-stretch xl:items-end gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 items-stretch sm:items-center w-full justify-start xl:justify-end">
              
              {/* Status Toggle Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 border text-sm rounded-xl px-4 py-2.5 focus:outline-none w-full sm:w-auto min-w-[140px] cursor-pointer text-left select-none font-semibold transition-colors",
                    selectedClient?.status === 'active' ? "bg-accent text-black border-accent hover:bg-[#bbf000]" :
                    selectedClient?.status === 'suspended' ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600" :
                    selectedClient?.status === 'ended' ? "bg-zinc-500 text-white border-zinc-500 hover:bg-zinc-600" :
                    selectedClient?.status === 'trial' ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600" :
                    selectedClient?.status === 'developing' ? "bg-purple-500 text-white border-purple-500 hover:bg-purple-600" :
                    "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50"
                  )}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {selectedClient?.status === 'active' && <><Rocket className="w-4 h-4" /> Ativo</>}
                    {selectedClient?.status === 'suspended' && <><Hand className="w-4 h-4" /> Suspenso</>}
                    {selectedClient?.status === 'ended' && <><Power className="w-4 h-4" /> Encerrado</>}
                    {selectedClient?.status === 'trial' && <><Clock className="w-4 h-4" /> {selectedClient?.trialEndDate ? 'Trial - ' + Math.max(0, Math.ceil((new Date(selectedClient.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + ' dias restantes' : 'Trial'}</>}
                    {selectedClient?.status === 'developing' && <><Code className="w-4 h-4" /> Em construção</>}
                    {!selectedClient?.status && 'Status'}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 shrink-0", isStatusDropdownOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute left-0 sm:left-auto sm:right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden w-full sm:min-w-[160px] p-anchored-overlay-enter-active"
                        style={{ transformOrigin: 'top' }}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('active')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium cursor-pointer"
                        >
                          <Rocket className="w-4 h-4 text-accent" /> Ativo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('trial')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium cursor-pointer"
                        >
                          <Clock className="w-4 h-4 text-blue-500" /> Trial
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('developing')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium cursor-pointer"
                        >
                          <Code className="w-4 h-4 text-purple-500" /> Em construção
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('suspended')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium cursor-pointer"
                        >
                          <Hand className="w-4 h-4 text-rose-500" /> Suspenso
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('ended')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium cursor-pointer"
                        >
                          <Power className="w-4 h-4 text-zinc-500" /> Encerrado
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div></div>
          
          {timeRange === 'custom' && (
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1 w-full justify-end">
                <input 
                   type="date"
                   value={customStart}
                   onChange={(e) => setCustomStart(e.target.value)}
                   className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-300 w-full sm:w-auto"
                   style={{ colorScheme: 'dark' }}
                />
                <span className="text-zinc-500 text-xs text-center">até</span>
                <input 
                   type="date"
                   value={customEnd}
                   onChange={(e) => setCustomEnd(e.target.value)}
                   className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-300 w-full sm:w-auto"
                   style={{ colorScheme: 'dark' }}
                />
             </div>
          )}
        </div>
      </div>

      {/* Ca
      {/* Cards de Status do Topo (NOC Hub Widgets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Custo Google Cloud */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-center min-h-[110px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block flex items-center justify-between">
            <span>Custo na Infra</span>
          </span>
          {(() => {
            const costs = calculateTotalCost();
            const realBillingCost = selectedClient?.gcpBillingCost;
            const prevMonthCost = selectedClient?.gcpBillingCostPrevMonth ?? 0;
            const currentCost = realBillingCost !== undefined ? realBillingCost : costs.currentBRL;
            const diff = currentCost - prevMonthCost;
            const isIncrease = diff > 0;
            const isDecrease = diff < 0;

            const diffFormatted = Math.abs(diff).toFixed(4).replace('.', ',');
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const prevMonthName = monthNames[(new Date().getMonth() + 11) % 12];

            return (
              <div className="space-y-1.5">
                <div>
                  <div className="text-emerald-600 font-extrabold text-2xl font-mono leading-none flex items-baseline gap-1.5">
                    <span>R$ {currentCost.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="text-[10px] mt-1 flex items-center gap-1">
                    {isIncrease ? (
                      <ArrowUpRight className="w-3 h-3 text-red-500" />
                    ) : isDecrease ? (
                      <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                    ) : null}
                    <span className={isIncrease ? "text-red-500" : isDecrease ? "text-emerald-500" : "text-zinc-500"}>
                      R$ {Math.abs(diff).toFixed(2).replace('.', ',')} {isIncrease ? 'a mais' : isDecrease ? 'a menos' : 'igual'} que no mês de {prevMonthName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Card 2: Última checagem */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-400 text-xs font-medium mb-1.5 block">Última checagem</span>
          <div className="text-white font-bold text-lg flex items-center gap-2" title={selectedClient?.lastMetricsUpdate ? new Date(selectedClient.lastMetricsUpdate).toLocaleString('pt-BR') : undefined}>
            <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">
              {selectedClient?.lastMetricsUpdate ? formatRelativeTime(selectedClient.lastMetricsUpdate) : 'Agora'}
            </span>
          </div>
        </div>

        {/* Card 3: Plano Contratado */}
        <div className="bg-[#D7FE03] border border-transparent rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-black/60 text-xs font-medium mb-1.5 block">Plano Contratado</span>
          <div className="text-black font-bold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-black" />
            <span className="truncate">{selectedClient?.plan || 'Free'}</span>
          </div>
        </div>

        {/* Card 4: Ambiente Ativo */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Ambiente Ativo</span>
          <div className="text-[#a1c200] font-bold text-lg truncate">
            {selectedClient?.name}
          </div>
        </div>
      </div>
      
      
      {/* Client Selector Cards */}
      <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide">
        {clients.map(client => {
          const isSelected = selectedClient?.id === client.id;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => setSelectedClientId(client.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[90px] h-[90px] rounded-2xl border transition-all duration-300 cursor-pointer shrink-0",
                isSelected
                  ? "border-accent bg-accent shadow-[0_0_20px_rgba(215,254,3,0.4)]"
                  : "border-zinc-200/80 bg-white hover:border-zinc-300 grayscale opacity-70 hover:opacity-100 shadow-none"
              )}
            >
              {client.logoUrl ? (
                <img src={client.logoUrl} alt={client.name} className={cn(
                  "w-10 h-10 rounded-full object-cover mb-2 border",
                  isSelected ? "border-black/10 bg-white" : "border-zinc-100"
                )} />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 uppercase border",
                  isSelected ? "bg-black/10 text-black border-transparent" : "bg-zinc-100 text-zinc-600 border-zinc-200"
                )}>
                  {client.logoInitials || client.name.substring(0, 2)}
                </div>
              )}
              <span className={cn(
                "text-[10px] font-medium truncate w-[75px] text-center px-1 leading-tight",
                isSelected ? "text-black font-bold" : "text-zinc-600"
              )}>
                {client.name.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 w-full flex flex-col">
        {/* Consumo de Cotas Limits */}
        <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="font-display text-lg font-bold flex items-center gap-2 text-black">
                 <Zap className="w-5 h-5 text-accent shrink-0" />
                 <span>Métricas do Google Cloud Monitoring</span>
              </h3>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 shrink-0">
  
  
                
  
                {/* Custom TimeRange Selector (Anchored Overlay) */}
                <div className="relative w-full sm:w-44">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimeDropdownOpen(!isTimeDropdownOpen);
                    }}
                    className="flex items-center justify-between gap-2 bg-white border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-300 cursor-pointer text-left select-none w-full"
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
                          className="absolute left-0 sm:left-auto sm:right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden w-full sm:min-w-[170px] p-anchored-overlay-enter-active"
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
                                  ? "text-accent font-semibold hover:bg-white/40"
                                  : "text-zinc-700 hover:bg-white"
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
                   className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#D7FE03] hover:bg-[#c4e602] text-[#0a1007] rounded-xl transition-all shadow-[0_0_20px_rgba(215,254,3,0.15)] disabled:opacity-50 cursor-pointer w-full sm:w-auto shrink-0"
                 >
                   <RefreshCw className={cn("w-4 h-4 shrink-0", isRefreshing && "animate-spin")} />
                   <span>Atualizar</span>
                 </button>
            
  
              </div>
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
                    <div className="bg-white border border-zinc-200 p-4 rounded-xl col-span-full overflow-x-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-500" /> Métricas Descobertas
                        </h3>
                        <button type="button" onClick={() => setDiscoveryResults(null)} className="text-zinc-500 hover:text-zinc-700 cursor-pointer">
                          <XOctagon className="w-4 h-4" />
                        </button>
                      </div>
                      <table className="w-full text-left text-sm text-zinc-700">
                        <thead className="bg-white text-zinc-500 sticky top-0">
                          <tr>
                            <th className="p-3 whitespace-nowrap">metric.type</th>
                            <th className="p-3 whitespace-nowrap">displayName</th>
                            <th className="p-3">description</th>
                            <th className="p-3 whitespace-nowrap">unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {discoveryResults.map((m: any, i: number) => (
                            <tr key={i} className="hover:bg-white/50">
                              <td className="p-3 font-mono text-xs break-words break-all text-emerald-600">{m.type}</td>
                              <td className="p-3 font-medium whitespace-nowrap">{m.displayName}</td>
                              <td className="p-3 text-zinc-500 text-xs min-w-[300px]">{m.description}</td>
                              <td className="p-3 font-mono text-xs text-zinc-500">{m.unit}</td>
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
                    <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200/80">
                      <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="font-medium text-sm text-zinc-700">{item.label}</span>
                             {item.freeTier > 0 && (
                               <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">Isento até {item.freeTier.toLocaleString()}{item.suffix}</span>
                             )}
                          </div>
                          <span className="font-bold text-lg text-zinc-900">
                            {val.toLocaleString()}
                          </span>
                      </div>
                      
                      {debugMode && (
                        <div className="text-xs text-zinc-600 font-mono break-all mb-3">{item.data?.metric}</div>
                      )}

                      {item.freeTier > 0 && (
                         <div className="w-full bg-white rounded-full h-3 mb-4 overflow-hidden border border-zinc-200 relative mt-2">
                            <div 
                              className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                              style={{ width: progressPercent + '%' }}
                            />
                         </div>
                      )}

                      {item.costPer100k > 0 && (
                         <div className="flex justify-between items-center text-xs p-2 rounded bg-white border border-zinc-200">
                            <span className="text-zinc-500">Estimativa de consumo:</span>
                            {estimatedCostBRL > 0 ? (
                               <span className="text-emerald-600 font-medium">~R$ {estimatedCostBRL.toFixed(4)} BRL</span>
                            ) : (
                               <span className="text-zinc-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">Dentro do limite gratuito</span>
                            )}
                         </div>
                      )}
                      
                      {item.key === 'realtime text-zinc-500' && (
                         <div className="flex justify-between items-center text-xs p-2 rounded bg-white border border-zinc-200">
                            <span className="text-zinc-500">Estimativa de consumo:</span>
                            <span className="text-emerald-600 font-medium font-mono">Incluído nas Leituras</span>
                         </div>
                      )}

                      {debugMode && debugInfo && (
                          <div className="mt-3 p-3 bg-black/40 rounded border border-zinc-200 overflow-x-auto text-xs text-zinc-500 font-mono space-y-1">
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
                     <div className="bg-white p-4 rounded-xl border border-zinc-200/80 mt-4">
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="text-zinc-700 font-medium text-sm">Armazenamento do Banco (Firestore)</span>
                             <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">Isento até 1 GB</span>
                          </div>
                          <span className="text-zinc-900 font-bold">
                            {(gcpMetrics.storageBytes?.value / 1024 / 1024).toFixed(2)} MB 
                            {gcpMetrics.storageBytes?.value > 0 && <span className="font-normal text-zinc-500 ml-2">({storageValGB.toFixed(4)} GB)</span>}
                          </span>
                       </div>
                       
                       {debugMode && (
                         <div className="text-xs text-zinc-600 font-mono break-all mb-3">{gcpMetrics.storageBytes?.metric || 'metric.type="firestore.googleapis.com/storage/data_and_index_storage_bytes"'}</div>
                       )}

                       <div className="w-full bg-white rounded-full h-3 mb-4 overflow-hidden border border-zinc-200 relative mt-2">
                          <div 
                            className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                            style={{ width: progressPercent + '%' }}
                          />
                       </div>

                       <div className="flex justify-between items-center text-xs p-2 rounded bg-white border border-zinc-200">
                             <span className="text-zinc-500">Estimativa de consumo:</span>
                             {storageCostBRL > 0 ? (
                                <span className="text-emerald-600 font-medium font-mono">~R$ {storageCostBRL.toFixed(4)} BRL / mês</span>
                             ) : (
                                <span className="text-zinc-500 font-medium font-mono">Dentro do limite gratuito</span>
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
                     <div className="bg-white p-4 rounded-xl border border-zinc-200/80 mt-4">
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                             <span className="text-zinc-700 font-medium text-sm">Armazenamento de Arquivos (Storage)</span>
                             <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">Isento até 5 GB</span>
                          </div>
                          <span className="text-zinc-900 font-bold">
                            {(finalStorageValue / 1024 / 1024).toFixed(2)} MB 
                            {finalStorageValue > 0 && <span className="font-normal text-zinc-500 ml-2">({cloudStorageValGB.toFixed(4)} GB)</span>}
                          </span>
                       </div>
                       
                       {debugMode && (
                         <div className="text-xs text-zinc-600 font-mono break-all mb-3">{activeMetricName || 'metric.type="storage.googleapis.com/storage/total_bytes"'}</div>
                       )}

                       <div className="w-full bg-white rounded-full h-3 mb-4 overflow-hidden border border-zinc-200 relative mt-2">
                          <div 
                            className={cn("h-full transition-all duration-500 rounded-full bg-gradient-to-r", progressColorClass)}
                            style={{ width: progressPercent + '%' }}
                          />
                       </div>

                       <div className="flex justify-between items-center text-xs p-2 rounded bg-white border border-zinc-200">
                             <span className="text-zinc-500">Estimativa de consumo:</span>
                             {cloudStorageCostBRL > 0 ? (
                                <span className="text-emerald-600 font-medium font-mono font-mono">~R$ {cloudStorageCostBRL.toFixed(4)} BRL / mês</span>
                             ) : (
                                <span className="text-zinc-500 font-medium font-mono font-mono">Dentro do limite gratuito</span>
                             )}
                       </div>
                     </div>
                     );
                  })()}

                  <div className="pt-4 mt-2 border-t border-zinc-200">
                    <div className="flex justify-between text-xs text-zinc-500">
                       <span>Última atualização (Timestamp)</span>
                       <span>{new Date(gcpMetrics.lastUpdated).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
            )}
        </div>

      </div>


      

      {/* Modal de Importação de Faturamento GCP via CSV / BigQuery */}
      <AnimatePresence>
        {isCsvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (csvSuccessCount === null && !isBqSyncing) setIsCsvModalOpen(false);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 max-w-2xl w-full relative z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-5"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-black flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent" />
                  Sincronizar Faturamento Google Cloud
                </h3>
                <p className="text-zinc-500 text-xs sm:text-sm mt-1">
                  Mantenha os custos reais do faturamento GCP de todos os seus clientes em perfeito sincronismo.
                </p>
              </div>

              

              {csvSuccessCount !== null ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-black">Sincronização concluída!</h4>
                  <p className="text-zinc-500 text-sm">
                    {csvSuccessCount} projeto(s) mapeado(s) e atualizado(s) com sucesso em sua base de clientes.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCsvModalOpen(false);
                      setCsvSuccessCount(null);
                      setParsedCsvRecords([]);
                      setBqResult(null);
                    }}
                    className="px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Fechar Painel
                  </button>
                </div>
              )  : (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl text-xs text-zinc-700 space-y-2">
                    <p className="font-semibold text-black flex items-center gap-1">
                      <Zap className="w-4 h-4 text-accent" />
                      Como funciona a sincronização automatizada?
                    </p>
                    <p className="leading-relaxed">
                      O faturamento real do Google Cloud é consolidado de forma programática exportando o <strong>Billing Export</strong> para uma tabela do <strong>Google BigQuery</strong>.
                    </p>
                    <p className="leading-relaxed">
                      O AnymaSystem usa a mesma chave de Service Account configurada para consultar a tabela de faturamento em tempo real, calcular o total mensal de cada projeto e atualizar no Firestore automaticamente!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-zinc-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                        BigQuery Project ID
                      </label>
                      <input 
                        type="text"
                        placeholder="ex: anyma-billing-prod"
                        value={bqProjectId}
                        onChange={(e) => setBqProjectId(e.target.value)}
                        className="bg-white border border-zinc-200 focus:border-zinc-300 text-zinc-900 text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                        Dataset ID
                      </label>
                      <input 
                        type="text"
                        placeholder="ex: gcp_billing"
                        value={bqDatasetId}
                        onChange={(e) => setBqDatasetId(e.target.value)}
                        className="bg-white border border-zinc-200 focus:border-zinc-300 text-zinc-900 text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                        Table ID / Export Name
                      </label>
                      <input 
                        type="text"
                        placeholder="ex: gcp_billing_export_resource_v1"
                        value={bqTableId}
                        onChange={(e) => setBqTableId(e.target.value)}
                        className="bg-white border border-zinc-200 focus:border-zinc-300 text-zinc-900 text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  {bqError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 font-medium">
                      {bqError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 mt-4">
                    <button
                      type="button"
                      disabled={isBqSyncing}
                      onClick={() => {
                        setIsCsvModalOpen(false);
                        setBqError(null);
                      }}
                      className="px-5 py-2.5 text-sm font-semibold bg-transparent hover:bg-zinc-100 text-zinc-500 hover:text-black rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isBqSyncing || !bqProjectId || !bqDatasetId || !bqTableId}
                      onClick={handleBqSync}
                      className="px-5 py-2.5 text-sm font-bold bg-accent hover:bg-accent/90 text-black rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(215,254,3,0.15)]"
                    >
                      {isBqSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Consultando BigQuery...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Executar Sincronização Direta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {isTrialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-zinc-900">Período de Trial</h3>
            <p className="text-sm text-zinc-500 mb-4">Selecione a data de encerramento do trial (quando deverá mudar para o status ativo).</p>
            <input 
              type="date"
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-accent mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsTrialModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmTrial}
                disabled={!trialEndDate}
                className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
