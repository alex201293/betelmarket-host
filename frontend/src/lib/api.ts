import axios from "axios";
import {
  mockUsage,
  mockPlans,
  mockUsers,
  mockDomains,
  mockEmails,
  mockDns,
  mockBackups,
  mockInvoices,
  mockBillingSummary,
  mockMetrics,
  mockAuditLogs,
  mockNotifications,
  mockApiKeys,
  mockMigrations,
  mockDnsInstructions,
} from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Demo mode flag - matches auth store
const DEMO_MODE = true;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Mock response helper
function mockResponse(data: any, status = 200) {
  return Promise.resolve({ data, status, statusText: "OK", headers: {}, config: {} as any });
}

function paginatedResponse(data: any[]) {
  return mockResponse({ data, current_page: 1, last_page: 1, total: data.length });
}

// Mock API interceptor for demo mode
if (DEMO_MODE) {
  api.interceptors.request.use((config) => {
    const url = config.url || "";
    const method = config.method?.toLowerCase() || "get";

    // Map URLs to mock data
    const mockRoutes: Record<string, () => any> = {
      "GET:/usage": () => mockResponse(mockUsage),
      "GET:/plans": () => mockResponse(mockPlans),
      "GET:/plans/public": () => mockResponse(mockPlans),
      "GET:/users": () => paginatedResponse(mockUsers),
      "GET:/domains": () => paginatedResponse(mockDomains),
      "GET:/emails": () => paginatedResponse(mockEmails),
      "GET:/dns": () => paginatedResponse(mockDns),
      "GET:/backups": () => paginatedResponse(mockBackups),
      "GET:/invoices": () => paginatedResponse(mockInvoices),
      "GET:/invoices/summary": () => mockResponse(mockBillingSummary),
      "GET:/metrics/current": () => mockResponse(mockMetrics),
      "GET:/audit-logs": () => paginatedResponse(mockAuditLogs),
      "GET:/notifications": () => paginatedResponse(mockNotifications),
      "GET:/notifications/unread-count": () => mockResponse({ unread_count: 2 }),
      "GET:/settings/api-keys": () => mockResponse(mockApiKeys),
      "GET:/subdomains": () => paginatedResponse([]),
      "GET:/migrations": () => paginatedResponse(mockMigrations),
      "GET:/apps": () => paginatedResponse([
        { id: 1, name: "my-api", runtime: "nodejs_20", port: 3001, status: "running", git_repo: "https://github.com/user/my-api.git", git_branch: "main", last_deployed_at: "2024-10-22T10:00:00Z", domain: { domain: "api.ejemplo.com" } },
        { id: 2, name: "flask-app", runtime: "python_312", port: 3002, status: "running", git_repo: "https://github.com/user/flask-app.git", git_branch: "production", last_deployed_at: "2024-10-21T15:30:00Z", domain: { domain: "app.mitienda.shop" } },
        { id: 3, name: "landing-next", runtime: "nodejs_22", port: 3003, status: "stopped", git_repo: null, git_branch: "main", last_deployed_at: null, domain: { domain: "startup.io" } },
      ]),
      "GET:/apps/runtimes": () => mockResponse({ nodejs_18: { name: "Node.js 18 LTS" }, nodejs_20: { name: "Node.js 20 LTS" }, nodejs_22: { name: "Node.js 22" }, python_311: { name: "Python 3.11" }, python_312: { name: "Python 3.12" }, go_122: { name: "Go 1.22" }, bun_1: { name: "Bun 1.x" } }),
      "GET:/ftp": () => mockResponse([
        { username: "bm_juan01_web", domain: "ejemplo.com", domain_id: 1, path: "/home/bm_juan01/web/ejemplo.com/public_html", status: "active" },
        { username: "bm_juan01_deploy", domain: "ejemplo.com", domain_id: 1, path: "/home/bm_juan01/web/ejemplo.com/public_html", status: "active" },
        { username: "bm_maria02_main", domain: "mitienda.shop", domain_id: 2, path: "/home/bm_maria02/web/mitienda.shop/public_html", status: "active" },
      ]),
      "GET:/databases": () => mockResponse([
        { id: 1, db_name: "bm_juan01_wordpress", db_user: "bm_juan01_wp", db_type: "mysql", size_mb: 85, max_connections: 10, status: "active" },
        { id: 2, db_name: "bm_juan01_store", db_user: "bm_juan01_store", db_type: "mysql", size_mb: 210, max_connections: 10, status: "active" },
        { id: 3, db_name: "bm_maria02_blog", db_user: "bm_maria02_blog", db_type: "mysql", size_mb: 32, max_connections: 5, status: "active" },
      ]),
    };

    const key = `${method.toUpperCase()}:${url}`;

    // Check exact match
    for (const [route, handler] of Object.entries(mockRoutes)) {
      if (key === route || url === route.split(":")[1]) {
        // Cancel the real request and return mock
        config.adapter = () => handler();
        return config;
      }
    }

    // Handle dynamic GET routes
    if (method === "get") {
      if (url.startsWith("/subdomains")) {
        config.adapter = () => paginatedResponse([]);
        return config;
      }
      if (url.includes("/dns")) {
        config.adapter = () => mockResponse(mockDnsInstructions);
        return config;
      }
      if (url.includes("/wordpress/") && url.includes("/status")) {
        config.adapter = () => mockResponse({
          installed: true,
          version: "6.5.2",
          site_url: "https://ejemplo.com",
          plugins: [
            { name: "akismet", status: "active", version: "5.3", update: "none" },
            { name: "woocommerce", status: "active", version: "8.7.0", update: "available" },
            { name: "yoast-seo", status: "active", version: "22.3", update: "none" },
            { name: "contact-form-7", status: "inactive", version: "5.9", update: "none" },
          ],
          themes: [{ name: "flavflavor", status: "active", version: "2.0" }],
          updates_available: true,
          updates: [{ version: "6.6.0" }],
        });
        return config;
      }
    }

    // Handle POST/PATCH/DELETE with success mock
    if (["post", "patch", "put", "delete"].includes(method)) {
      config.adapter = () => mockResponse({ message: "Success (demo mode)", id: Date.now() }, 201);
      return config;
    }

    // Default: let it through (will fail but that's ok)
    config.adapter = () => mockResponse({});
    return config;
  });
} else {
  // Production mode: attach token
  api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Handle 401 responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
}
