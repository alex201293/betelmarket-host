"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const captchaRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteKey && !captchaToken) {
      toast.error("Por favor, verifica que no eres un robot.");
      return;
    }
    try {
      await login(email, password, captchaToken);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Credenciales incorrectas");
      // Reset captcha
      if (siteKey && window.grecaptcha) {
        window.grecaptcha.reset();
        setCaptchaToken("");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`}
          strategy="afterInteractive"
          onReady={() => {
            window.onRecaptchaLoad = () => {
              if (captchaRef.current && !captchaReady) {
                window.grecaptcha.render(captchaRef.current, {
                  sitekey: siteKey,
                  callback: (token: string) => setCaptchaToken(token),
                  "expired-callback": () => setCaptchaToken(""),
                });
                setCaptchaReady(true);
              }
            };
            if (window.grecaptcha && window.grecaptcha.render) {
              window.onRecaptchaLoad();
            }
          }}
        />
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/images/logo-betelmarket.png"
            alt="BetelMarket"
            className="mx-auto h-16 w-auto"
          />
          <p className="mt-3 text-sm text-gray-500">
            Inicia sesión en tu panel de hosting
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {siteKey && (
              <div className="flex justify-center">
                <div ref={captchaRef} />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-brand-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
