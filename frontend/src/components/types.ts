export interface LeadEmail {
  id: string;
  name: string;
  email: string;
  website: string;
  emailStatus: string;
  keyword: string;
  createdAt: string;
  crawlLogId?: string;
}

export interface LeadPhone {
  id: string;
  name: string;
  phone: string;
  website: string;
  keyword: string;
  createdAt: string;
  crawlLogId?: string;
}

export interface LeadSocial {
  id: string;
  name: string;
  platform: string;
  url: string;
  website: string;
  keyword: string;
  createdAt: string;
  crawlLogId?: string;
}

export interface SmtpSettings {
  host: string;
  port: string;
  user: string;
  pass: string;
  senderName?: string;
  senderEmail?: string;
  secure?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  keyword: string;
  urlsCount: number;
  newEmailsCount: number;
  newPhonesCount: number;
  newSocialsCount: number;
}
