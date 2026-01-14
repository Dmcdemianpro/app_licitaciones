"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    telefono: "",
    departamento: "",
    cargo: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/usuarios");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear el usuario");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Usuarios</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Crear usuario</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">Completa los datos para registrar un nuevo usuario.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <Card className="mx-auto max-w-3xl border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
              Datos del usuario
            </CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-200">
              Email y contraseña son obligatorios. Los demás campos son opcionales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Nombre</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Email *</Label>
                  <Input
                    required
                    type="email"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="usuario@correo.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Contraseña *</Label>
                  <Input
                    required
                    type="password"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Rol</Label>
                  <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuario</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Teléfono</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={form.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-800 dark:text-slate-200">Departamento</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={form.departamento}
                    onChange={(e) => handleChange("departamento", e.target.value)}
                    placeholder="TIC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-800 dark:text-slate-200">Cargo</Label>
                <Input
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                  value={form.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  placeholder="Encargado Departamentales"
                />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Crear usuario
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10"
                  type="button"
                >
                  <Link href="/usuarios">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
