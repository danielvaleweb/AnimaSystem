import { AlertCircle, Clock, Database, ServerCrash, LogIn, Edit3, Link2, AlertOctagon } from 'lucide-react';
import { cn } from '../utils';

// Synced with mockLogs from AuditView
const mockAlerts = [
  {
    id: 'LOG-10020',
    type: 'error',
    title: 'TechFlow Solutions',
    description: 'Firestore Read Quota exceeded',
    time: 'Hoje, 10:15'
  },
  {
    id: 'LOG-10022',
    type: 'integration',
    title: 'LojaVip E-commerce',
    description: 'Falha de webhook Asaas (HTTP 504)',
    time: 'Hoje, 12:05'
  },
  {
    id: 'LOG-10024',
    type: 'change',
    title: 'TechFlow Solutions',
    description: 'Alteração de plano (Pro -> Enterprise)',
    time: 'Hoje, 14:25'
  },
  {
    id: 'LOG-10025',
    type: 'login',
    title: 'Sistema Global',
    description: 'Autenticação bem sucedida (admin@animahub.com)',
    time: 'Hoje, 14:30'
  }
];

export function AlertsPanel() {
  return (
    <div className="bg-zinc-900 border border-zinc-200/80 rounded-[2rem] p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-bold">Alertas Recentes</h3>
          <p className="text-sm text-zinc-500">Auditoria de sistema (Logs Recentes)</p>
        </div>
        <button className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
          Ver Auditoria
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {mockAlerts.map(alert => {
          let Icon = AlertCircle;
          let iconColor = 'text-zinc-500';
          let bgColor = 'bg-zinc-800';

          if (alert.type === 'error') {
            Icon = AlertOctagon;
            iconColor = 'text-red-500';
            bgColor = 'bg-red-500/10';
          } else if (alert.type === 'integration') {
            Icon = Link2;
            iconColor = 'text-orange-400';
            bgColor = 'bg-orange-500/10';
          } else if (alert.type === 'change') {
            Icon = Edit3;
            iconColor = 'text-blue-400';
            bgColor = 'bg-blue-500/10';
          } else if (alert.type === 'login') {
            Icon = LogIn;
            iconColor = 'text-emerald-400';
            bgColor = 'bg-emerald-500/10';
          }

          return (
            <div key={alert.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-700/50 transition-colors">
              <div className={cn("p-2.5 rounded-xl shrink-0", bgColor)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-zinc-800 truncate">{alert.title}</h4>
                  <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">{alert.time}</span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
