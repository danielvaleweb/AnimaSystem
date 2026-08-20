export type InvestmentCategory = 'Ações' | 'FIIs' | 'ETFs' | 'BDRs' | 'Tesouro Direto' | 'CDB' | 'LCI' | 'LCA' | 'Renda Fixa' | 'Criptomoedas' | 'Outros' | 'Caixa';

export type InvestmentPriceSource = 'API' | 'MANUAL' | 'CALCULATED';

export type TransactionType = 'COMPRA' | 'VENDA' | 'APORTE' | 'RESGATE' | 'DIVIDENDO' | 'JCP' | 'RENDIMENTO' | 'JUROS' | 'TAXA' | 'BONIFICAÇÃO' | 'DESDOBRAMENTO' | 'AMORTIZAÇÃO';

export interface InvestmentAsset {
  id: string;
  ownerId: string;
  ticker: string;
  name: string;
  category: InvestmentCategory;
  subCategory?: string;
  institution?: string;
  currency: string;
  priceSource: InvestmentPriceSource;
  
  // Dynamic fields recalculated based on transactions
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  
  // Fields for external quotes
  currentPrice: number;
  lastUpdate?: string;
  isActive: boolean;

  // Specifics for fixed income/Treasury
  indexer?: string; // IPCA, Selic, CDI
  rate?: number; // 110 (for 110% CDI), or 5.5 (for 5.5% IPCA+)
  maturityDate?: string; // YYYY-MM-DD
  
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  ownerId: string;
  assetId: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  quantity: number;
  unitPrice: number;
  grossValue: number;
  taxes: number; // taxas
  netValue: number;
  institution?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface PortfolioSnapshot {
  id: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
  totalInvested: number;
  currentValue: number;
  profit: number;
  rentability: number;
  contributions: number;
  yields: number;
}

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
  plan: 'Nenhum' | 'Starter' | 'Profissional' | 'Enterprise';
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
  gcpBillingCostPrevMonth?: number;
  gcpBillingPeriod?: string;
  gcpBillingLastSync?: string;
  createdAt?: string;
}
