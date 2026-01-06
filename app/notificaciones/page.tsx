"use client";

import { useState } from "react";
import { Bell, Mail, Settings, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

export default function NotificacionesPage() {
  const [configuracion, setConfiguracion] = useState({
    emailTickets: true,
    emailLicitaciones: true,
    emailCitas: false,
    pushTickets: true,
    pushLicitaciones: true,
    pushCitas: true,
  });

  const notificaciones: any[] = [];

  const toggle = (key: keyof typeof configuracion) =>
    setConfiguracion((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Notificaciones</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Centro de alertas</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">Configura qué eventos quieres recibir.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones recientes
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                Centro de actividad. Conecta tu backend para ver las alertas.
              </CardDescription>
            </CardHeader>
            <CardContent>
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                <Sparkles className="h-6 w-6 text-indigo-300" />
                <p className="text-sm text-slate-800 dark:text-slate-200">Sin notificaciones. Llegarán aquí cuando se activen.</p>
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-100 border border-slate-300 dark:border-white/20">
                  Centro limpio
                </Badge>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id} className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4 shadow-sm backdrop-blur">
                  <p className="font-semibold text-slate-900 dark:text-white">{n.titulo}</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{n.mensaje}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferencias
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">Personaliza canales y tipos de alerta.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-200">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-semibold">Email</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Email de tickets</Label>
                  <Switch checked={configuracion.emailTickets} onCheckedChange={() => toggle("emailTickets")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Email de licitaciones</Label>
                  <Switch checked={configuracion.emailLicitaciones} onCheckedChange={() => toggle("emailLicitaciones")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Email de citas</Label>
                  <Switch checked={configuracion.emailCitas} onCheckedChange={() => toggle("emailCitas")} />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-200">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm font-semibold">Push</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push de tickets</Label>
                  <Switch checked={configuracion.pushTickets} onCheckedChange={() => toggle("pushTickets")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push de licitaciones</Label>
                  <Switch checked={configuracion.pushLicitaciones} onCheckedChange={() => toggle("pushLicitaciones")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push de citas</Label>
                  <Switch checked={configuracion.pushCitas} onCheckedChange={() => toggle("pushCitas")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
