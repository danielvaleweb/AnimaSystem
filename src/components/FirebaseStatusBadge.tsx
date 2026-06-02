import { useState, useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils';

export function FirebaseStatusBadge() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection_test'));
        setStatus('connected');
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setStatus('error');
          console.error("Firebase connection error: Client is offline. Please check your configuration.");
        } else if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
          // Even if permission is denied, it means we reached Firestore successfully!
          setStatus('connected');
        } else {
          setStatus('error');
          console.error("Firebase connection error: ", error);
        }
      }
    }
    testConnection();
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
      {status === 'connecting' && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
      {status === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
      
      <div className="flex flex-col">
        <span className="text-xs font-bold text-zinc-300 leading-none mb-1">Master DB</span>
        <span className={cn(
          "text-[10px] uppercase font-bold tracking-wider leading-none",
          status === 'connecting' ? "text-zinc-500" :
          status === 'connected' ? "text-emerald-500" : "text-red-500"
        )}>
          {status === 'connecting' ? 'Conectando...' :
           status === 'connected' ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
