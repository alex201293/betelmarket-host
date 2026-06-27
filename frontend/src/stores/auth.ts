import { create } from "zustand";
import { api } from "@/lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "reseller" | "client";
  status: string;
  hosting_accounts?: any[];
}

// Demo mode flag - set to true to bypass API auth
const DEMO_MODE = true;

const DEMO_USER: User = {
  id: 1,
  name: "Admin Demo",
  email: "admin@betelmarket.com",
  role: "super_admin",
  status: "active",
  hosting_accounts: [],
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_MODE ? DEMO_USER : null,
  token: DEMO_MODE
    ? "demo-token"
    : typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null,
  isLoading: false,

  login: async (email: string, password: string) => {
    if (DEMO_MODE) {
      const demoToken = "demo-token";
      localStorage.setItem("token", demoToken);
      set({ token: demoToken, user: DEMO_USER, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    if (DEMO_MODE) {
      const demoToken = "demo-token";
      localStorage.setItem("token", demoToken);
      set({ token: demoToken, user: { ...DEMO_USER, name, email }, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: password,
      });
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    if (!DEMO_MODE) {
      try {
        await api.post("/auth/logout");
      } catch {
        // Ignore errors on logout
      }
    }
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  fetchUser: async () => {
    if (DEMO_MODE) {
      set({ user: DEMO_USER, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null, isLoading: false });
    }
  },

  setToken: (token: string) => {
    localStorage.setItem("token", token);
    set({ token });
  },
}));
