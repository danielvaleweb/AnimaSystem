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

export type ViewType = 'landing' | 'dashboard' | 'clients' | 'client-detail' | 'finance' | 'tickets' | 'monitor' | 'audit' | 'settings' | 'leads' | 'colab-auth' | 'customization' | 'investments' | 'agenda';

export interface TransactionData {
  id?: string;
  ownerId: string;
  title?: string; // Título da transação
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
  plan: 'Nenhum' | 'Starter' | 'Pro' | 'Enterprise';
  domain: string;
  projectName?: string;
  firebaseProjectId: string;
  firebaseDatabaseName?: string;
  firebaseSdkConfig?: string;
  parsedFirebaseConfig?: Record<string, string>;
  monthlyValue: number;
  dueDate: number;
  status: 'active' | 'suspended' | 'trial' | 'ended' | 'developing';
  trialEndDate?: string;
  cnpj?: string;
  email?: string;
  website?: string;
  hireDate?: string;
  endDate?: string;
  cpf?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  logoUrl?: string;
  companyRazaoSocial?: string;
  companyCnpj?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyInscricaoEstadual?: string;
  monitorCollections?: { id: string; label: string; collectionPath: string; readWeight: number; writeWeight: number }[];
  lastMetricsUpdate?: string;
  lastGcpMetrics?: any;
  lastRealMetrics?: any;
  gcpBillingCost?: number;
  gcpBillingPeriod?: string;
  gcpBillingLastSync?: string;
}
