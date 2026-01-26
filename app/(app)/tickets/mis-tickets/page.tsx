"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, RefreshCcw, Search, User2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TicketSla = {
  responseStatus: "ok" | "warning" | "breached" | "met" | "none";
  resolutionStatus: "ok" | "warning" | "breached" | "met" | "none";
  overallStatus: "ok" | "warning" | "breached" | "met" | "none";
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  responseRemainingMinutes: number | null;
  resolutionRemainingMinutes: number | null;
};

type Ticket = {
  id: string;
  folio: number;
  folioFormateado: string;
  title: string;
  description?: string | null;
  type: string;
  priority: "ALTA" | "MEDIA" | "BAJA";
  status: "CREADO" | "ASIGNADO" | "EN_PROGRESO" | "PENDIENTE_VALIDACION" | "FINALIZADO" | "REABIERTO";
  assignee?: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string | null;
  sla?: TicketSla;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar la lista de tickets");
  return res.json();
};

const statusLabels: Record<Ticket["status"], string> = {
  CREADO: "Creado",
  ASIGNADO: "Asignado",
  EN_PROGRESO: "En progreso",
  PENDIENTE_VALIDACION: "Pendiente de validacion",
  FINALIZADO: "Finalizado",
  REABIERTO: "Reabierto",
};

const priorityLabels: Record<Ticket["priority"], string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const slaLabels: Record<TicketSla["overallStatus"], string> = {
  ok: "En tiempo",
  warning: "Por vencer",
  breached: "Vencido",
  met: "Cumplido",
  none: "Sin SLA",
};

type StatusFilter = "all" | "pending" | Ticket["status"];

export default function MisTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Ticket["priority"]>("all");

  const { data, error, isLoading, mutate } = useSWR<Ticket[]>("/api/tickets/mis-tickets", fetcher, {
    refreshInterval: 12_000,
  });

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    return data.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.folioFormateado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" &&
          ["ASIGNADO", "EN_PROGRESO", "REABIERTO"].includes(ticket.status)) ||
        ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [data, priorityFilter, searchTerm, statusFilter]);

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "ALTA":
        return "destructive";
      case "MEDIA":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "CREADO":
        return "destructive";
      case "ASIGNADO":
        return "default";
      case "EN_PROGRESO":
        return "secondary";
      case "PENDIENTE_VALIDACION":
        return "outline";
      case "REABIERTO":
        return "destructive";
      case "FINALIZADO":
      default:
        return "outline";
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "short" }).format(new Date(value));

  const formatRemaining = (minutes: number | null): string => {
    if (minutes == null) return "Sin tiempo";
    if (minutes <= 0) return "Vencido";
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return `${hours}h ${remainingMinutes}m`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getSlaIndicatorColor = (status: TicketSla["overallStatus"]) => {
    switch (status) {
      case "ok":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "breached":
        return "bg-red-500";
      case "met":
        return "bg-green-500";
      default:
        return "bg-slate-400";
    }
  };

  const getSlaIndicator = (ticket: Ticket) => {
    if (!ticket.sla) {
      return { status: "none" as const, label: slaLabels.none, detail: "Sin datos" };
    }
    const responsePhase = !ticket.firstResponseAt;
    const phaseLabel = responsePhase ? "Respuesta" : "Resolucion";
    const remaining = responsePhase
      ? ticket.sla.responseRemainingMinutes
      : ticket.sla.resolutionRemainingMinutes;
    const rawStatus = responsePhase ? ticket.sla.responseStatus : ticket.sla.resolutionStatus;
    const overall = ticket.status === "FINALIZADO" ? ticket.sla.resolutionStatus : rawStatus;
    const detail =
      remaining == null
        ? ticket.status === "FINALIZADO"
          ? "Cerrado"
          : "Sin tiempo"
        : formatRemaining(remaining);
    return {
      status: overall,
      label: slaLabels[overall],
      detail: `${phaseLabel}: ${detail}`,
    };
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              MIS TICKETS
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Bandeja Personal
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
            <Link href="/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Todos los tickets
            </Link>
          </Button>
          <Button onClick={() => mutate()} variant="outline" size="icon" className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Asignados</CardTitle>
                <User2 className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.length || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.filter((t) => t.status === "EN_PROGRESO").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.filter((t) => t.status === "FINALIZADO").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.filter((t) => t.priority === "ALTA" && t.status !== "FINALIZADO").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Filtros de búsqueda</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Busca y filtra tus tickets asignados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
                  <Input
                    placeholder="Buscar por título o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-full md:w-[180px] border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="CREADO">Creado</SelectItem>
                    <SelectItem value="ASIGNADO">Asignado</SelectItem>
                    <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                    <SelectItem value="PENDIENTE_VALIDACION">Pendiente de validacion</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    <SelectItem value="REABIERTO">Reabierto</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
                  <SelectTrigger className="w-full md:w-[180px] border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Mis Tickets ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-600 dark:text-slate-400">
                  Cargando...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-red-400">
                  Error al cargar los tickets
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No tienes tickets asignados que coincidan con los filtros
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-900 dark:text-white">ID</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Título</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Tipo</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Prioridad</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Estado</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">SLA</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Creado por</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="hover:bg-white/5 cursor-pointer border-slate-200 dark:border-white/10"
                          onClick={() => (window.location.href = `/tickets/${ticket.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-200">
                            {ticket.folioFormateado}
                          </TableCell>
                          <TableCell className="font-medium">{ticket.title}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{ticket.type}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {priorityLabels[ticket.priority]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(ticket.status)}>
                              {statusLabels[ticket.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const slaInfo = getSlaIndicator(ticket);
                              return (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 rounded-full ${getSlaIndicatorColor(slaInfo.status)}`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                      {slaInfo.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {slaInfo.detail}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {ticket.owner.name || ticket.owner.email}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(ticket.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
