export interface KPIData {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  status?: 'good' | 'neutral' | 'bad';
  icon: any;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface AlertData {
  id: string;
  type: 'vencimento' | 'consumo' | 'erro' | 'falha';
  title: string;
  description: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
}

export type ViewType = 'landing' | 'dashboard' | 'clients' | 'client-detail' | 'finance' | 'tickets' | 'monitor' | 'audit' | 'settings';

export interface TransactionData {
  id?: string;
  ownerId: string;
  type: 'entrada' | 'saida';
  clientName: string; // Describe entry name or client name
  amount: number;
  date: string; // the date paid or recorded in YYYY-MM-DD format
  dueDate?: string; // in YYYY-MM-DD
  status: 'paid' | 'pending' | 'overdue';
  method: 'pix' | 'credit_card' | 'boleto' | 'manual';
  gateway: 'asaas' | 'manual';
}

export interface ClientData {
  id: string;
  name: string;
  logoInitials: string;
  responsible: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  domain: string;
  projectName?: string;
  firebaseProjectId: string;
  firebaseDatabaseName?: string;
  firebaseSdkConfig?: string;
  parsedFirebaseConfig?: Record<string, string>;
  monthlyValue: number;
  dueDate: number;
  status: 'active' | 'suspended' | 'trial';
}
