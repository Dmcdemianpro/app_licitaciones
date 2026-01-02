import Link from "next/link";
import { Calendar, CheckCircle, Gavel, Plus, Ticket as TicketIcon, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import prisma from "@/lib/prisma";

const statusLabels: Record<string, string> = {
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

type RecentTicket = {
  id: string
  title: string
  priority: string
  status: string
  updatedAt: Date
}

export default async function Dashboard() {
  const [totalTickets, openTickets, inProgress, finishedTickets, recentTickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "ABIERTO" } }),
    prisma.ticket.count({ where: { status: "EN_PROGRESO" } }),
    prisma.ticket.count({ where: { status: { in: ["RESUELTO", "CERRADO"] } } }),
    prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]) as [number, number, number, number, RecentTicket[]];

  const stats = [
    {
      title: "Tickets abiertos",
      value: openTickets.toString(),
      description: "Pendientes de atención",
      icon: TicketIcon,
      accent: "bg-amber-500/20 text-amber-300",
    },
    {
      title: "En progreso",
      value: inProgress.toString(),
      description: "Atendiéndose ahora",
      icon: CheckCircle,
      accent: "bg-sky-500/20 text-sky-300",
    },
    {
      title: "Finalizados",
      value: finishedTickets.toString(),
      description: "Resueltos o cerrados",
      icon: Calendar,
      accent: "bg-emerald-500/20 text-emerald-300",
    },
    {
      title: "Total de tickets",
      value: totalTickets.toString(),
      description: "Histórico en la plataforma",
      icon: TrendingUp,
      accent: "bg-indigo-500/20 text-indigo-300",
    },
  ];

  const upcomingBids: Array<{ id: string; title: string; institution: string; daysLeft: number }> = [];

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(value);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold text-white">Sistema de Licitaciones</h1>
          <p className="text-sm text-slate-200">Resumen ejecutivo y accesos rápidos</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            asChild
            size="sm"
            variant="primary"
          >
            <Link href="/tickets">
              <TicketIcon className="mr-2 h-4 w-4" />
              Ver tickets
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="primary"
          >
            <Link href="/tickets/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo ticket
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-6 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border-white/10 bg-white/10 text-white shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.accent}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{stat.value}</div>
                <p className="text-xs text-slate-200">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-white/10 bg-slate-900/70 text-white shadow-xl backdrop-blur lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TicketIcon className="h-5 w-5" />
                Movimientos recientes
              </CardTitle>
              <CardDescription className="text-slate-200">Últimas actualizaciones en la base de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTickets.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/30 bg-white/5 p-6 text-center text-sm text-white">
                  No hay tickets todavía. Crea el primero para comenzar.
                </div>
              )}
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 shadow-sm backdrop-blur"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{ticket.title}</p>
                    <p className="text-xs font-mono text-slate-300">{ticket.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{priorityLabels[ticket.priority]}</Badge>
                    <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
                    <span className="text-xs text-slate-300">{formatDate(ticket.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t border-white/10 bg-white/5">
              <Button
                asChild
                size="sm"
                variant="primary"
              >
                <Link href="/tickets">Ir al listado completo</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/10 bg-gradient-to-b from-indigo-900/70 via-slate-900 to-slate-950 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gavel className="h-5 w-5 text-indigo-600" />
                Licitaciones próximas
              </CardTitle>
              <CardDescription className="text-slate-200">Fechas de cierre cercanas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingBids.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/25 bg-white/5 p-4 text-center text-sm text-slate-100">
                  Aún no hay licitaciones próximas. Añade una nueva para verla aquí.
                </div>
              ) : (
                upcomingBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="rounded-lg border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{bid.title}</p>
                      <Badge variant={bid.daysLeft <= 5 ? "destructive" : "default"}>{bid.daysLeft} días</Badge>
                    </div>
                    <p className="text-xs text-slate-300">{bid.institution}</p>
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

        <Card className="border-white/10 bg-white/10 text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>Entradas frecuentes para tu equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="primary" className="justify-start gap-2">
                <Link href="/tickets/nuevo">
                  <Plus className="h-4 w-4" />
                  Crear ticket
                </Link>
              </Button>
              <Button
                asChild
                variant="primary"
                className="justify-start"
              >
                <Link href="/licitaciones/nueva">Registrar licitación</Link>
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
    </div>
  );
}
