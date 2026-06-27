import { create } from "zustand";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "reseller" | "client";
  status: string;
  hosting_accounts?: any[];
}

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
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoading: false,

  login: async (email: string, password: string) => {
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
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  fetchUser: async () => {
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
