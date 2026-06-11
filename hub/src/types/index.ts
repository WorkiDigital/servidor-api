export interface Project {
  id: string;
  name: string;
  domain: string;
  customDomain?: string;
  defaultDomain?: string;
  subdomain?: string;
  pixelId: string;
  datasetId?: string;
  apiVersion: string;
  hasToken: boolean;
  tokenMasked?: string;
  testEventCode?: string;
  status: 'active' | 'paused';
  dnsStatus?: string;
  sslStatus?: string;
  lastError?: string | null;
  totalEventsSent?: number;
  firstEventAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface MetaConfigPayload {
  pixelId?: string;
  datasetId?: string;
  apiVersion?: string;
  accessToken?: string;
  testEventCode?: string;
  domain?: string;
}

export interface SnippetData {
  script: string;
  cnameTarget: string;
  clientCname: string;
  integrity: string;
}

export interface GrowthPoint {
  date: string;
  visitantes: number;
  pageviews: number;
  conversoes: number;
}

export interface FunnelData {
  visitantes: number;
  engajados: number;
  identificados: number;
  whatsapp: number;
  convertidos: number;
}

export interface ChartItem {
  label: string;
  value: number;
}

export interface MetricsData {
  visitantes: number;
  leads: number;
  conversoes: number;
  faturamento: number;
  instagram: number;
  metaAds: number;
  growth: GrowthPoint[];
  funnel: FunnelData;
  devices: ChartItem[];
  cities: ChartItem[];
  states: ChartItem[];
  countries: ChartItem[];
  origins: ChartItem[];
}

export type LeadStatus = 'visiting' | 'identified' | 'converted';
export type LeadTemp = 'cold' | 'warm' | 'hot';

export interface Lead {
  id: string;
  temp: LeadTemp;
  entrada: string;
  contato: string;
  cidade: string;
  estado: string;
  dispositivo: string;
  origem: string;
  meta: boolean;
  ultimaAtividade: string;
  status: LeadStatus;
  eventName: string;
  url?: string;
}

export interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export type DatePreset = 'today' | 'yesterday' | '7d' | '15d' | '30d' | 'custom';
