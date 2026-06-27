// Mock data for demo mode (no backend required)

export const mockUsage = {
  disk_used_mb: 12800,
  disk_limit_mb: 51200,
  domains: 8,
  mailboxes: 23,
  active_accounts: 5,
};

export const mockPlans = [
  { id: 1, name: "Starter", max_domains: 1, max_subdomains: 3, max_mailboxes: 5, disk_quota_mb: 5120, bandwidth_quota_mb: 51200, max_databases: 1, price: "4.99", status: "active" },
  { id: 2, name: "Business", max_domains: 10, max_subdomains: 30, max_mailboxes: 50, disk_quota_mb: 51200, bandwidth_quota_mb: 512000, max_databases: 10, price: "14.99", status: "active" },
  { id: 3, name: "Enterprise", max_domains: 100, max_subdomains: 300, max_mailboxes: 500, disk_quota_mb: 256000, bandwidth_quota_mb: 2048000, max_databases: 100, price: "49.99", status: "active" },
];

export const mockUsers = [
  { id: 1, name: "Admin", email: "admin@betelmarket.com", role: "super_admin", status: "active" },
  { id: 2, name: "Reseller Demo", email: "reseller@betelmarket.com", role: "reseller", status: "active" },
  { id: 3, name: "Juan Pérez", email: "juan@ejemplo.com", role: "client", status: "active" },
  { id: 4, name: "María García", email: "maria@ejemplo.com", role: "client", status: "active" },
  { id: 5, name: "Carlos López", email: "carlos@empresa.net", role: "client", status: "suspended" },
];

export const mockDomains = [
  { id: 1, hosting_account_id: 1, domain: "ejemplo.com", ssl_enabled: true, status: "active", is_temporary: false, created_at: "2024-06-15T10:00:00Z" },
  { id: 2, hosting_account_id: 1, domain: "mitienda.shop", ssl_enabled: true, status: "active", is_temporary: false, created_at: "2024-07-20T08:30:00Z" },
  { id: 3, hosting_account_id: 2, domain: "coral-tiger-384921.betelhost.site", ssl_enabled: false, status: "active", is_temporary: true, created_at: "2024-08-10T14:00:00Z" },
  { id: 4, hosting_account_id: 2, domain: "blog.dev", ssl_enabled: true, status: "active", is_temporary: false, created_at: "2024-09-01T16:00:00Z" },
  { id: 5, hosting_account_id: 3, domain: "mint-wolf-629174.betelhost.site", ssl_enabled: false, status: "pending", is_temporary: true, created_at: "2024-10-05T09:00:00Z" },
];

export const mockEmails = [
  { id: 1, domain_id: 1, email: "info@ejemplo.com", quota_mb: 500, usage_mb: 120, status: "active" },
  { id: 2, domain_id: 1, email: "admin@ejemplo.com", quota_mb: 1000, usage_mb: 450, status: "active" },
  { id: 3, domain_id: 2, email: "ventas@mitienda.shop", quota_mb: 500, usage_mb: 80, status: "active" },
  { id: 4, domain_id: 2, email: "soporte@mitienda.shop", quota_mb: 500, usage_mb: 310, status: "active" },
  { id: 5, domain_id: 3, email: "hello@startup.io", quota_mb: 2000, usage_mb: 1200, status: "active" },
  { id: 6, domain_id: 4, email: "contact@blog.dev", quota_mb: 500, usage_mb: 50, status: "suspended" },
];

export const mockDns = [
  { id: 1, domain_id: 1, type: "A", name: "@", value: "192.168.1.100", ttl: 3600, priority: null },
  { id: 2, domain_id: 1, type: "CNAME", name: "www", value: "ejemplo.com", ttl: 3600, priority: null },
  { id: 3, domain_id: 1, type: "MX", name: "@", value: "mail.ejemplo.com", ttl: 3600, priority: 10 },
  { id: 4, domain_id: 1, type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", ttl: 3600, priority: null },
  { id: 5, domain_id: 2, type: "A", name: "@", value: "10.0.0.50", ttl: 1800, priority: null },
  { id: 6, domain_id: 2, type: "AAAA", name: "@", value: "2001:db8::1", ttl: 3600, priority: null },
];

export const mockBackups = [
  { id: 1, hosting_account_id: 1, backup_path: "/backup/bm_abc123/", size_mb: 245, status: "completed", created_at: "2024-10-20T03:00:00Z" },
  { id: 2, hosting_account_id: 1, backup_path: "/backup/bm_abc123/", size_mb: 251, status: "completed", created_at: "2024-10-21T03:00:00Z" },
  { id: 3, hosting_account_id: 2, backup_path: null, size_mb: 0, status: "in_progress", created_at: "2024-10-22T03:00:00Z" },
  { id: 4, hosting_account_id: 1, backup_path: null, size_mb: 0, status: "failed", created_at: "2024-10-19T03:00:00Z" },
];

export const mockInvoices = [
  { id: 1, invoice_number: "INV-2024-00001", total: "14.99", status: "paid", issue_date: "2024-09-01", due_date: "2024-09-15", payment_method: "credit_card" },
  { id: 2, invoice_number: "INV-2024-00002", total: "49.99", status: "paid", issue_date: "2024-10-01", due_date: "2024-10-15", payment_method: "paypal" },
  { id: 3, invoice_number: "INV-2024-00003", total: "14.99", status: "pending", issue_date: "2024-11-01", due_date: "2024-11-15", payment_method: null },
  { id: 4, invoice_number: "INV-2024-00004", total: "4.99", status: "overdue", issue_date: "2024-08-01", due_date: "2024-08-15", payment_method: null },
];

export const mockBillingSummary = {
  total_revenue: 84.96,
  pending_amount: 14.99,
  overdue_amount: 4.99,
  total_invoices: 4,
};

export const mockMetrics = {
  cpu_usage: 23.5,
  ram_usage: 67.2,
  ram_total_mb: 8192,
  ram_used_mb: 5505,
  disk_usage: 42.0,
  disk_total_gb: 500,
  disk_used_gb: 210,
  active_connections: 34,
  load_average_1: 0.85,
  load_average_5: 0.72,
  load_average_15: 0.65,
  total_domains: 8,
  total_mail_accounts: 23,
  total_users: 5,
  uptime_hours: 720.5,
};

export const mockAuditLogs = [
  { id: 1, action: "post.api/users", resource_type: "User", resource_id: 5, ip_address: "192.168.1.10", created_at: "2024-10-22T14:30:00Z", user: { name: "Admin", email: "admin@betelmarket.com" } },
  { id: 2, action: "post.api/domains", resource_type: "Domain", resource_id: 5, ip_address: "192.168.1.10", created_at: "2024-10-22T13:15:00Z", user: { name: "Admin", email: "admin@betelmarket.com" } },
  { id: 3, action: "delete.api/emails/6", resource_type: "Email", resource_id: 6, ip_address: "10.0.0.5", created_at: "2024-10-21T09:00:00Z", user: { name: "Reseller Demo", email: "reseller@betelmarket.com" } },
  { id: 4, action: "post.api/backups", resource_type: "Backup", resource_id: 3, ip_address: "192.168.1.10", created_at: "2024-10-20T03:00:00Z", user: { name: "Admin", email: "admin@betelmarket.com" } },
  { id: 5, action: "patch.api/users/5", resource_type: "User", resource_id: 5, ip_address: "192.168.1.10", created_at: "2024-10-19T16:45:00Z", user: { name: "Admin", email: "admin@betelmarket.com" } },
];

export const mockNotifications = [
  { id: "n1", title: "Disk Quota Warning", message: "Account bm_abc123 is at 92% disk usage.", severity: "critical", read_at: null, created_at: "2024-10-22T10:00:00Z" },
  { id: "n2", title: "Backup Completed", message: "Backup for ejemplo.com completed successfully.", severity: "info", read_at: null, created_at: "2024-10-21T03:05:00Z" },
  { id: "n3", title: "SSL Expiration", message: "SSL for startup.io expires in 7 days.", severity: "warning", read_at: "2024-10-20T08:00:00Z", created_at: "2024-10-20T07:00:00Z" },
];

export const mockApiKeys = [
  { id: 1, name: "CI/CD Pipeline", last_used_at: "2024-10-22T12:00:00Z", created_at: "2024-09-15T10:00:00Z" },
  { id: 2, name: "Monitoring Script", last_used_at: null, created_at: "2024-10-01T08:00:00Z" },
];

export const mockMigrations = [
  { id: 1, domain_id: 1, source_host: "mail.hostinger.com", source_port: 993, source_email: "info@ejemplo.com", destination_email: "info@ejemplo.com", status: "completed", messages_migrated: 1245, messages_total: 1245, error_log: null, started_at: "2024-10-20T10:00:00Z", completed_at: "2024-10-20T10:45:00Z", created_at: "2024-10-20T10:00:00Z", domain: { domain: "ejemplo.com" } },
  { id: 2, domain_id: 2, source_host: "imap.gmail.com", source_port: 993, source_email: "ventas@mitienda.shop", destination_email: "ventas@mitienda.shop", status: "in_progress", messages_migrated: 320, messages_total: 890, error_log: null, started_at: "2024-10-22T08:00:00Z", completed_at: null, created_at: "2024-10-22T08:00:00Z", domain: { domain: "mitienda.shop" } },
  { id: 3, domain_id: 1, source_host: "mail.cpanel.net", source_port: 993, source_email: "admin@ejemplo.com", destination_email: "admin@ejemplo.com", status: "failed", messages_migrated: 0, messages_total: 0, error_log: "Connection refused: timeout after 30s", started_at: "2024-10-19T14:00:00Z", completed_at: "2024-10-19T14:01:00Z", created_at: "2024-10-19T14:00:00Z", domain: { domain: "ejemplo.com" } },
];

export const mockDnsInstructions = {
  domain: "ejemplo.com",
  status: "active",
  required_records: [
    { type: "A", name: "@", value: "192.168.1.100", ttl: 3600 },
    { type: "A", name: "www", value: "192.168.1.100", ttl: 3600 },
    { type: "MX", name: "@", value: "mail.ejemplo.com", priority: 10, ttl: 3600 },
    { type: "A", name: "mail", value: "192.168.1.100", ttl: 3600 },
    { type: "TXT", name: "@", value: "v=spf1 a mx ip4:192.168.1.100 ~all", ttl: 3600 },
  ],
  instructions: [
    "Go to your domain registrar (GoDaddy, Namecheap, etc.)",
    "Update the DNS records as shown below",
    "Wait for propagation (usually 1-48 hours)",
    "Come back and verify the domain",
  ],
};
