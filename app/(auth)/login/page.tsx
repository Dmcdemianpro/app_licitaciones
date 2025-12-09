"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 Anotación explícita del evento del formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) setError("Credenciales inválidas");
    else window.location.href = "/";
    setLoading(false);
  };

  // Tipa los onChange para inputs (opcional pero recomendable)
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 bg-white/95 text-slate-900 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.25em]">Acceso seguro</span>
          </div>
          <CardTitle className="text-2xl font-semibold">Iniciar sesión</CardTitle>
          <CardDescription className="text-slate-500">
            Ingresa tus credenciales para acceder al Sistema de Licitaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700">Correo electrónico</label>
              <Input
                placeholder="usuario@dominio.cl"
                value={email}
                onChange={handleEmailChange}
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-700">Contraseña</label>
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={handlePasswordChange}
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            {error && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button
              className="group w-full bg-indigo-600 hover:bg-indigo-700"
              type="submit"
              disabled={loading}
            >
              <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              {loading ? "Ingresando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
