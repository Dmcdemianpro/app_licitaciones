"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { BarChart3, Clock, Download, FileText, PieChart, Sparkles, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Metrics = {
  totals: {
    total: number;
    abiertos: number;
    finalizados: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  mttrMinutes: number | null;
  responseMinutes: number | null;
  slaBreaches: {
    response: number;
    resolution: number;
  };
  productivity: Array<{
    id: string;
    name: string | null;
    email: string | null;
    assignedCount: number;
    closedCount: number;
    avgResolutionMinutes: number | null;
  }>;
  csat: {
    average: number | null;
    count: number;
    distribution: Record<string, number>;
  };
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar los datos");
  return res.json();
};

const formatMinutes = (minutes: number | null) => {
  if (minutes == null) return "Sin datos";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 24) return `${hours}h ${remaining}m`;
  const days = Math.floor(hours / 24);
  const dayHours = hours % 24;
  return `${days}d ${dayHours}h`;
};

export default function ReportesPage() {
  const [filtros, setFiltros] = useState({
    tipoReporte: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const { data, error, isLoading } = useSWR<{ metrics: Metrics }>(
    "/api/reportes/tickets/metrics",
    fetcher,
    { refreshInterval: 30_000 }
  );

  const metrics = data?.metrics;
  const statusEntries = useMemo(() => {
    const entries = Object.entries(metrics?.byStatus ?? {});
    return entries.sort((a, b) => b[1] - a[1]);
  }, [metrics?.byStatus]);
  const priorityEntries = useMemo(() => {
    const entries = Object.entries(metrics?.byPriority ?? {});
    return entries.sort((a, b) => b[1] - a[1]);
  }, [metrics?.byPriority]);
  const typeEntries = useMemo(() => {
    const entries = Object.entries(metrics?.byType ?? {});
    return entries.sort((a, b) => b[1] - a[1]);
  }, [metrics?.byType]);
  const maxStatus = Math.max(1, ...statusEntries.map(([, value]) => value));
  const maxPriority = Math.max(1, ...priorityEntries.map(([, value]) => value));
  const maxType = Math.max(1, ...typeEntries.map(([, value]) => value));

  const reportesDisponibles = [
    { id: "tickets-resumen", nombre: "Resumen de Tickets", descripcion: "Estadísticas generales por período", icono: FileText, categoria: "Tickets" },
    { id: "licitaciones-activas", nombre: "Licitaciones Activas", descripcion: "Estado actual de licitaciones", icono: BarChart3, categoria: "Licitaciones" },
    { id: "licitaciones-historico", nombre: "Histórico de Licitaciones", descripcion: "Adjudicaciones y evolución", icono: PieChart, categoria: "Licitaciones" },
  ];

  const generarReporte = () => {
    console.log("Generando reporte con filtros:", filtros);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <SidebarTrigger />
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Reportes</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reportes y análisis</h1>
          <p className="text-sm text-slate-800 dark:text-slate-200">Genera reportes personalizados y explora plantillas.</p>
        </div>
      </header>

      <div className="flex-1 space-y-6 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Resumen en tiempo real</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                MTTR, volumen y satisfaccion de tickets en vivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && (
                <p className="text-sm text-slate-700 dark:text-slate-200">Cargando metricas...</p>
              )}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  No se pudo cargar el resumen.
                </p>
              )}
              {metrics && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
                      <p className="mt-2 text-2xl font-semibold">{metrics.totals.total}</p>
                      <p className="text-xs text-slate-500">
                        Abiertos {metrics.totals.abiertos} · Finalizados {metrics.totals.finalizados}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <Clock className="h-4 w-4 text-indigo-400" />
                        MTTR
                      </div>
                      <p className="mt-2 text-2xl font-semibold">{formatMinutes(metrics.mttrMinutes)}</p>
                      <p className="text-xs text-slate-500">Tiempo medio de resolucion</p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <Users className="h-4 w-4 text-indigo-400" />
                        Respuesta
                      </div>
                      <p className="mt-2 text-2xl font-semibold">{formatMinutes(metrics.responseMinutes)}</p>
                      <p className="text-xs text-slate-500">Tiempo medio de primera respuesta</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <Star className="h-4 w-4 text-amber-400" />
                        CSAT
                      </div>
                      <p className="mt-2 text-2xl font-semibold">
                        {metrics.csat.average != null ? metrics.csat.average.toFixed(1) : "Sin datos"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {metrics.csat.count} respuestas
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SLA</p>
                      <p className="mt-2 text-2xl font-semibold">{metrics.slaBreaches.response + metrics.slaBreaches.resolution}</p>
                      <p className="text-xs text-slate-500">
                        Brechas respuesta {metrics.slaBreaches.response} · resolucion {metrics.slaBreaches.resolution}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Agentes</p>
                      <p className="mt-2 text-2xl font-semibold">{metrics.productivity.length}</p>
                      <p className="text-xs text-slate-500">Con tickets asignados</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-3 rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-sm font-semibold">Estado</p>
                      {statusEntries.length === 0 && (
                        <p className="text-sm text-slate-500">Sin datos</p>
                      )}
                      {statusEntries.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-24 text-xs text-slate-600 dark:text-slate-300">{key}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                            <div
                              className="h-2 rounded-full bg-indigo-500"
                              style={{ width: `${Math.round((value / maxStatus) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-sm font-semibold">Prioridad</p>
                      {priorityEntries.length === 0 && (
                        <p className="text-sm text-slate-500">Sin datos</p>
                      )}
                      {priorityEntries.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-24 text-xs text-slate-600 dark:text-slate-300">{key}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                            <div
                              className="h-2 rounded-full bg-amber-500"
                              style={{ width: `${Math.round((value / maxPriority) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                      <p className="text-sm font-semibold">Tipo</p>
                      {typeEntries.length === 0 && (
                        <p className="text-sm text-slate-500">Sin datos</p>
                      )}
                      {typeEntries.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-24 text-xs text-slate-600 dark:text-slate-300">{key}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${Math.round((value / maxType) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4">
                    <p className="text-sm font-semibold">Productividad por agente</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {metrics.productivity.slice(0, 6).map((agent) => (
                        <div
                          key={agent.id}
                          className="rounded-lg border border-white/10 bg-white/80 dark:bg-white/5 p-3"
                        >
                          <p className="text-sm font-medium">
                            {agent.name || agent.email || "Sin nombre"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Asignados {agent.assignedCount} · Cerrados {agent.closedCount}
                          </p>
                          <p className="text-xs text-slate-500">
                            Resolucion promedio {formatMinutes(agent.avgResolutionMinutes)}
                          </p>
                        </div>
                      ))}
                      {metrics.productivity.length === 0 && (
                        <p className="text-sm text-slate-500">Sin agentes registrados.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Generar nuevo reporte</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                Configura los parámetros para exportar un reporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de reporte</Label>
                  <Select
                    value={filtros.tipoReporte}
                    onValueChange={(value) => setFiltros((prev) => ({ ...prev, tipoReporte: value }))}
                  >
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets-resumen">Resumen de Tickets</SelectItem>
                      <SelectItem value="licitaciones-activas">Licitaciones Activas</SelectItem>
                      <SelectItem value="licitaciones-historico">Histórico de Licitaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <Button
                onClick={generarReporte}
                variant="primary"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Generar reporte
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Plantillas de reporte</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">Explora los tipos de reportes disponibles.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {reportesDisponibles.map((reporte) => (
                <div
                  key={reporte.id}
                  className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/90 dark:bg-white/10 p-4 shadow-sm backdrop-blur"
                >
                  <div className="rounded-md bg-indigo-500/20 p-2">
                    <reporte.icono className="h-4 w-4 text-indigo-600 dark:text-indigo-200" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{reporte.nombre}</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{reporte.descripcion}</p>
                  </div>
                  <Badge variant="secondary">{reporte.categoria}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Reportes recientes</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">Historial de descargas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                <Sparkles className="h-6 w-6 text-indigo-300" />
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  Aún no hay reportes generados. Usa el generador para crear el primero.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
