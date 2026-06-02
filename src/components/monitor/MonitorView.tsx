import { useState, useEffect } from 'react';
import { 
  Database, HardDrive, Users, Zap, Globe, 
  CheckCircle2, AlertTriangle, XOctagon, Activity, Server, Clock
} from 'lucide-react';
import { cn } from '../../utils';

type ServiceStatus = 'online' | 'warning' | 'critical';

interface ServiceData {
  id: string;
  name: string;
  icon: any;
  status: ServiceStatus;
  uptime: string;
  latency: string;
  load: string;
  message?: string;
}

const mockServices: ServiceData[] = [
  {
    id: 'firestore',
    name: 'Firestore DB',
    icon: Database,
    status: 'online',
    uptime: '99.99%',
    latency: '45ms',
    load: '32%',
  },
  {
    id: 'storage',
    name: 'Cloud Storage',
    icon: HardDrive,
    status: 'online',
    uptime: '99.98%',
    latency: '120ms',
    load: '18%',
  },
  {
    id: 'auth',
    name: 'Authentication',
    icon: Users,
    status: 'online',
    uptime: '100%',
    latency: '30ms',
    load: '12%',
  },
  {
    id: 'functions',
    name: 'Cloud Functions',
    icon: Zap,
    status: 'warning',
    uptime: '99.85%',
    latency: '450ms',
    load: '85%',
    message: 'Alta latência detectada na região us-central1'
  },
  {
    id: 'hosting',
    name: 'Firebase Hosting',
    icon: Globe,
    status: 'online',
    uptime: '99.99%',
    latency: '15ms',
    load: '4%',
  }
];

const mockAlerts = [
  {
    id: 1,
    service: 'Cloud Functions',
    severity: 'warning',
    message: 'Tempo de execução (cold start) excedendo 2s para funções de relatório.',
    time: 'Há 5 min'
  },
  {
    id: 2,
    service: 'Firestore DB',
    severity: 'critical',
    message: 'Pico de consumo excessivo no projeto do cliente TechFlow.',
    time: 'Há 12 min'
  },
  {
    id: 3,
    service: 'Cloud Storage',
    severity: 'online',
    message: 'Limpeza automática de arquivos temporários concluída.',
    time: 'Há 1h'
  }
];

export function MonitorView() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ status, className }: { status: ServiceStatus, className?: string }) => {
    if (status === 'online') return <CheckCircle2 className={cn("text-emerald-400", className)} />;
    if (status === 'warning') return <AlertTriangle className={cn("text-orange-400", className)} />;
    return <XOctagon className={cn("text-rose-400", className)} />;
  };

  const getStatusColor = (status: ServiceStatus) => {
    if (status === 'online') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (status === 'warning') return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* NOC Header */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-accent to-emerald-400"></div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center relative">
            <Server className="w-8 h-8 text-accent relative z-10" />
            <div className={cn("absolute inset-0 bg-accent/20 rounded-2xl transition-opacity duration-1000", pulse ? "opacity-100" : "opacity-0")}></div>
          </div>
          <div>
             <h2 className="font-display text-2xl font-bold text-zinc-100">Network Operations Center</h2>
             <p className="text-zinc-400 text-sm mt-1">Status em tempo real da infraestrutura global (Firebase)</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex flex-col items-end min-w-[120px]">
            <span className="text-xs text-zinc-500 mb-1">Status Geral</span>
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Operacional
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex flex-col items-end min-w-[120px]">
            <span className="text-xs text-zinc-500 mb-1">Última checagem</span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium text-sm">
               <Clock className="w-4 h-4 text-zinc-400" />
               Agora
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        
        {/* Services Grid */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Serviços Core
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockServices.map(service => (
               <div key={service.id} className={cn(
                 "p-5 rounded-2xl border transition-all",
                 service.status === 'warning' ? "bg-orange-500/5 border-orange-500/20" :
                 service.status === 'critical' ? "bg-rose-500/5 border-rose-500/20" :
                 "bg-zinc-900 border-zinc-800/50 hover:border-zinc-700/50"
               )}>
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                     <div className={cn(
                       "p-2.5 rounded-xl",
                       service.status === 'warning' ? "bg-orange-500/10 text-orange-400" :
                       service.status === 'critical' ? "bg-rose-500/10 text-rose-400" :
                       "bg-zinc-800 text-zinc-300"
                     )}>
                       <service.icon className="w-5 h-5" />
                     </div>
                     <h4 className="font-medium text-zinc-200">{service.name}</h4>
                   </div>
                   <div className={cn("px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border", getStatusColor(service.status))}>
                     <StatusIcon status={service.status} className="w-3.5 h-3.5" />
                     {service.status === 'online' ? 'Online' : service.status === 'warning' ? 'Atenção' : 'Crítico'}
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mb-4">
                   <div>
                     <span className="block text-xs text-zinc-500 mb-1">Uptime</span>
                     <span className="text-sm font-mono text-zinc-300">{service.uptime}</span>
                   </div>
                   <div>
                     <span className="block text-xs text-zinc-500 mb-1">Latência</span>
                     <span className="text-sm font-mono text-zinc-300">{service.latency}</span>
                   </div>
                   <div>
                     <span className="block text-xs text-zinc-500 mb-1">Carga</span>
                     <span className="text-sm font-mono text-zinc-300">{service.load}</span>
                   </div>
                 </div>

                 {service.message && (
                   <div className={cn(
                     "mt-3 text-xs p-3 rounded-lg flex items-start gap-2",
                     service.status === 'warning' ? "bg-orange-500/10 text-orange-300" : "bg-rose-500/10 text-rose-300"
                   )}>
                     <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                     <p>{service.message}</p>
                   </div>
                 )}
               </div>
            ))}
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              Automated Alerts
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
            </h3>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {mockAlerts.map(alert => (
              <div key={alert.id} className="relative pl-6 pb-6 border-l border-zinc-800 last:border-transparent last:pb-0">
                <div className={cn(
                  "absolute left-[-5px] top-1 w-[9px] h-[9px] rounded-full border-2 border-zinc-900",
                  alert.severity === 'critical' ? 'bg-rose-400' : 
                  alert.severity === 'warning' ? 'bg-orange-400' : 'bg-emerald-400'
                )}></div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-zinc-500">{alert.service}</span>
                    <span className="text-xs text-zinc-600 font-mono">{alert.time}</span>
                  </div>
                  <p className={cn(
                    "text-sm",
                    alert.severity === 'critical' ? 'text-rose-400 font-medium' : 
                    alert.severity === 'warning' ? 'text-orange-400' : 'text-zinc-300'
                  )}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <button className="w-full py-2.5 rounded-xl border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
              Ver Histórico Completo
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
