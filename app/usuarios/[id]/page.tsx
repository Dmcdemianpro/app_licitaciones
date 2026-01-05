"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, ShieldCheck, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  activo: boolean;
  telefono: string | null;
  departamento: string | null;
  cargo: string | null;
};

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<UserData>({
    id: "",
    name: "",
    email: "",
    role: "USER",
    activo: true,
    telefono: "",
    departamento: "",
    cargo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/usuarios/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar el usuario");
        }
        const data = await res.json();
        setForm({
          id: data.user.id,
          name: data.user.name || "",
          email: data.user.email,
          role: data.user.role || "USER",
          activo: data.user.activo,
          telefono: data.user.telefono || "",
          departamento: data.user.departamento || "",
          cargo: data.user.cargo || "",
        });
      } catch (err) {
        setError("No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (key: keyof UserData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/usuarios");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo actualizar el usuario");
      }
    } catch (err) {
      setError("Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Usuarios</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar usuario</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error && !form.id) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Usuarios</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar usuario</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-300">{error}</p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
                <Link href="/usuarios">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a usuarios
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Usuarios</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar usuario</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200">Modifica los datos del usuario.</p>
          </div>
        </div>
        <Button variant="outline" asChild className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
          <Link href="/usuarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <Card className="mx-auto max-w-3xl border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
              Datos del usuario
            </CardTitle>
            <CardDescription className="text-slate-200">
              Actualiza la información del usuario. Todos los campos son opcionales excepto el email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Nombre</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.name ?? ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Email *</Label>
                  <Input
                    required
                    type="email"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="usuario@correo.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Rol</Label>
                  <Select value={form.role || "USER"} onValueChange={(v) => handleChange("role", v)}>
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuario</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Teléfono</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.telefono ?? ""}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Departamento</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.departamento ?? ""}
                    onChange={(e) => handleChange("departamento", e.target.value)}
                    placeholder="Ej: Tecnología"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Cargo</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.cargo ?? ""}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    placeholder="Ej: Desarrollador"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Usuario activo</Label>
                  <p className="text-sm text-slate-400">
                    Desactiva este usuario para revocar su acceso al sistema
                  </p>
                </div>
                <Switch
                  checked={form.activo}
                  onCheckedChange={(checked) => handleChange("activo", checked)}
                />
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
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
