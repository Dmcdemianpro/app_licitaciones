"use client";

import { useEffect, useState } from "react";
import { Cog, Globe, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Preferences = {
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklySummary: boolean;
  soporteEmail: string;
};

const STORAGE_KEY = "app:preferences";

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Preferences>({
    language: "es",
    emailNotifications: true,
    pushNotifications: true,
    weeklySummary: false,
    soporteEmail: "soporte@empresa.com",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPrefs({ ...prefs, ...JSON.parse(stored) });
      } catch {
        // ignore parse errors
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast({ title: "Preferencias guardadas", description: "Tus ajustes se han aplicado localmente." });
  };

  const handleReset = () => {
    const defaults: Preferences = {
      language: "es",
      emailNotifications: true,
      pushNotifications: true,
      weeklySummary: false,
      soporteEmail: "soporte@empresa.com",
    };
    setPrefs(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    toast({ title: "Restablecido", description: "Se restauraron las preferencias predeterminadas." });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Configuración</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Preferencias del sistema</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">Ajustes generales y notificaciones.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Preferencias generales
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                Ajusta idioma de interfaz, canales de notificación y correo de soporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma
                  </Label>
                  <Select
                    value={prefs.language}
                    onValueChange={(value) => setPrefs((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Correo de soporte</Label>
                  <Input
                    type="email"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    value={prefs.soporteEmail}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, soporteEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Email</p>
                    <p className="text-xs text-slate-800 dark:text-slate-300">Alertas en tu correo</p>
                  </div>
                  <Switch
                    checked={prefs.emailNotifications}
                    onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, emailNotifications: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Push</p>
                    <p className="text-xs text-slate-800 dark:text-slate-300">Notificaciones en navegador</p>
                  </div>
                  <Switch
                    checked={prefs.pushNotifications}
                    onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, pushNotifications: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Resumen semanal</p>
                    <p className="text-xs text-slate-800 dark:text-slate-300">Envía un resumen cada semana</p>
                  </div>
                  <Switch
                    checked={prefs.weeklySummary}
                    onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, weeklySummary: v }))}
                  />
                </div>
              </div>

              {!loading && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                  >
                    Guardar cambios
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="primary"
                  >
                    Restablecer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
                Seguridad (informativo)
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                La gestión de contraseñas y roles se realiza desde la sección de Usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-6 text-sm text-slate-800 dark:text-slate-200">
              Para habilitar MFA u otros parámetros de seguridad, conecta tu backend y expón las opciones aquí.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
