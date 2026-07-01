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
    onRecaptchaLoadRegister: () => void;
  }
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();
  const captchaRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const renderCaptcha = () => {
    if (captchaRef.current && !captchaRef.current.hasChildNodes() && window.grecaptcha?.render) {
      try {
        window.grecaptcha.render(captchaRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      } catch (e) {
        // Already rendered, ignore
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteKey && !captchaToken) {
      toast.error("Por favor, verifica que no eres un robot.");
      return;
    }
    try {
      await register(name, email, password, captchaToken);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar");
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
          src={`https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadRegister&render=explicit`}
          strategy="afterInteractive"
          onReady={() => {
            window.onRecaptchaLoadRegister = () => renderCaptcha();
            if (window.grecaptcha?.render) renderCaptcha();
          }}
        />
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/images/logo-login-register.png"
            alt="BetelMarket"
            className="mx-auto h-16 w-auto"
          />
          <p className="mt-3 text-sm text-gray-500">
            Crea tu cuenta de hosting
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder="Mínimo 8 caracteres"
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
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
