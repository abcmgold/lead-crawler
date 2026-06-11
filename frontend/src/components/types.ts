export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  emailStatus: string;
  keyword: string;
  createdAt: string;
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
  newLeadsCount: number;
}
