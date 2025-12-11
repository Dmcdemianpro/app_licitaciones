"use client";

import { Calendar, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function CitasPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Citas y eventos</p>
            <h1 className="text-3xl font-bold text-white">Agenda del equipo</h1>
            <p className="text-sm text-slate-200">Programa y registra tus reuniones.</p>
          </div>
        </div>
        <Button variant="primary" asChild>
          <Link href="/citas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </header>

      <div className="flex-1 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <Card className="mx-auto max-w-3xl border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Sin citas registradas</CardTitle>
            <CardDescription className="text-slate-200">
              Integra tu fuente de datos o crea tu primera cita para visualizar la agenda.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
            <Calendar className="h-10 w-10 text-indigo-300" />
            <p className="text-sm text-slate-200">
              Cuando registres citas aparecerán aquí agrupadas por fecha y tipo.
            </p>
            <Button variant="primary" asChild>
              <Link href="/citas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Crear cita
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
