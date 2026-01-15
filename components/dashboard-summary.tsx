"use client";

import Link from "next/link";
import useSWR from "swr";
import { Calendar, CheckCircle, Gavel, Ticket as TicketIcon, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard";

type Props = {
  initialSummary: DashboardSummary;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("No se pudo cargar el resumen");
  }
  return res.json();
};

const statusLabels: Record<string, string> = {
  CREADO: "Creado",
  ASIGNADO: "Asignado",
  INICIADO: "En progreso",
  FINALIZADO: "Finalizado",
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const priorityLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const upcomingBids: Array<{ id: string; title: string; institution: string; daysLeft: number }> = [];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("es-ES", { timeStyle: "short" }).format(new Date(value));

export default function DashboardSummary({ initialSummary }: Props) {
  const { data, isValidating } = useSWR<DashboardSummary>("/api/dashboard", fetcher, {
    fallbackData: initialSummary,
    refreshInterval: 10_000,
    revalidateOnFocus: true,
  });

  const summary = data ?? initialSummary;
  const total = summary.totals.total;
  const lastUpdate = summary.serverTime ? formatTime(summary.serverTime) : "ahora";
  const percentOfTotal = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  const stats = [
    {
      title: "Tickets abiertos",
      value: summary.totals.open,
      description: "Pendientes de atencion",
      icon: TicketIcon,
      accent: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
      bar: "from-amber-400 to-amber-600",
      percent: percentOfTotal(summary.totals.open),
    },
    {
      title: "En progreso",
      value: summary.totals.inProgress,
      description: "Atendiendose ahora",
      icon: CheckCircle,
      accent: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
      bar: "from-sky-400 to-sky-600",
      percent: percentOfTotal(summary.totals.inProgress),
    },
    {
      title: "Finalizados",
      value: summary.totals.finished,
      description: "Resueltos o cerrados",
      icon: Calendar,
      accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
      bar: "from-emerald-400 to-emerald-600",
      percent: percentOfTotal(summary.totals.finished),
    },
    {
      title: "Total de tickets",
      value: summary.totals.total,
      description: "Historico en la plataforma",
      icon: TrendingUp,
      accent: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
      bar: "from-indigo-400 to-indigo-600",
      percent: total > 0 ? 100 : 0,
    },
  ];

  return (
    <div className="flex-1 space-y-6 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">Actualizacion en vivo</span>
          {isValidating && <span className="text-emerald-500">actualizando</span>}
        </div>
        <span className="text-slate-500 dark:text-slate-400">Actualizado {lastUpdate}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            style={{ animationDelay: `${index * 80}ms` }}
            className="relative overflow-hidden border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.accent}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-semibold">{stat.value}</div>
                <Badge
                  variant="secondary"
                  className="bg-white/70 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                >
                  {stat.percent}%
                </Badge>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200">{stat.description}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${stat.bar}`}
                  style={{ width: `${stat.percent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 text-slate-900 dark:text-white shadow-xl backdrop-blur lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TicketIcon className="h-5 w-5" />
              Movimientos recientes
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-200">
              Ultimas actualizaciones en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recentTickets.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/30 bg-slate-100 dark:bg-white/5 p-6 text-center text-sm text-slate-700 dark:text-white">
                No hay tickets todavia. Crea el primero para comenzar.
              </div>
            )}
            {summary.recentTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                style={{ animationDelay: `${index * 60}ms` }}
                className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-white/10 px-4 py-3 shadow-sm backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-500"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{ticket.title}</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{ticket.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{priorityLabels[ticket.priority]}</Badge>
                  <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
                  <span className="text-xs text-slate-800 dark:text-slate-300">
                    {formatDateTime(ticket.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <Button
              asChild
              size="sm"
              variant="primary"
            >
              <Link href="/tickets">Ir al listado completo</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-gradient-to-b from-indigo-50 via-purple-50 to-white dark:from-indigo-900/70 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-indigo-600" />
              Licitaciones proximas
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-200">Fechas de cierre cercanas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBids.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/25 bg-slate-100 dark:bg-white/5 p-4 text-center text-sm text-slate-700 dark:text-slate-100">
                Aun no hay licitaciones proximas. Anade una nueva para verla aqui.
              </div>
            ) : (
              upcomingBids.map((bid) => (
                <div
                  key={bid.id}
                  className="rounded-lg border border-slate-200 dark:border-white/20 bg-slate-100 dark:bg-white/10 p-3 shadow-sm backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{bid.title}</p>
                    <Badge variant={bid.daysLeft <= 5 ? "destructive" : "default"}>{bid.daysLeft} dias</Badge>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300">{bid.institution}</p>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button
              asChild
              variant="primary"
              className="w-full"
            >
              <Link href="/licitaciones">Ver licitaciones</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>Acciones rapidas</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-200">Entradas frecuentes para tu equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="primary" className="justify-start gap-2">
              <Link href="/tickets/nuevo">
                Crear ticket
              </Link>
            </Button>
            <Button
              asChild
              variant="primary"
              className="justify-start"
            >
              <Link href="/licitaciones/nueva">Registrar licitacion</Link>
            </Button>
            <Button
              asChild
              variant="primary"
              className="justify-start"
            >
              <Link href="/citas/nueva">Agendar cita</Link>
            </Button>
            <Button
              asChild
              variant="primary"
              className="justify-start"
            >
              <Link href="/reportes">Generar reporte</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
