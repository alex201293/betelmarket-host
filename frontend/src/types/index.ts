export interface Plan {
  id: number;
  name: string;
  max_domains: number;
  max_subdomains: number;
  max_mailboxes: number;
  disk_quota_mb: number;
  bandwidth_quota_mb: number;
  max_databases: number;
  price: string;
  status: string;
}

export interface HostingAccount {
  id: number;
  user_id: number;
  plan_id: number;
  hestia_username: string;
  status: "active" | "suspended" | "pending" | "deleted";
  disk_used_mb: number;
  disk_limit_mb: number;
  user?: User;
  plan?: Plan;
  domains?: Domain[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "reseller" | "client";
  status: string;
  hosting_accounts?: HostingAccount[];
}

export interface Domain {
  id: number;
  hosting_account_id: number;
  domain: string;
  ssl_enabled: boolean;
  status: "active" | "suspended" | "pending" | "deleted";
  created_at: string;
  hosting_account?: HostingAccount;
}

export interface MailAccount {
  id: number;
  domain_id: number;
  email: string;
  quota_mb: number;
  usage_mb: number;
  status: "active" | "suspended" | "deleted";
  domain?: Domain;
}

export interface DnsRecord {
  id: number;
  domain_id: number;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV";
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  domain?: Domain;
}

export interface Backup {
  id: number;
  hosting_account_id: number;
  backup_path: string | null;
  size_mb: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: string;
  hosting_account?: HostingAccount;
}

export interface Subdomain {
  id: number;
  domain_id: number;
  subdomain: string;
  full_domain: string;
  ssl_enabled: boolean;
  status: "active" | "pending" | "suspended" | "deleted";
  domain?: Domain;
}

export interface Invoice {
  id: number;
  user_id: number;
  invoice_number: string;
  amount: string;
  tax: string;
  total: string;
  currency: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
}

export interface Notification {
  id: string;
  user_id: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  severity: "info" | "warning" | "critical";
  read_at: string | null;
  created_at: string;
}

export interface ServerMetric {
  cpu_usage: number;
  ram_usage: number;
  ram_total_mb: number;
  ram_used_mb: number;
  disk_usage: number;
  disk_total_gb: number;
  disk_used_gb: number;
  load_average_1: number;
  load_average_5: number;
  load_average_15: number;
  total_domains: number;
  total_mail_accounts: number;
  total_users: number;
  uptime_hours: number;
}

export interface UsageData {
  disk_used_mb: number;
  disk_limit_mb: number;
  domains: number;
  mailboxes: number;
  active_accounts?: number;
}
