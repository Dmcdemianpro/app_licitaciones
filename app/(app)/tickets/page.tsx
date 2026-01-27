"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, RefreshCcw, Search, TicketPlus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
  canal?: "PORTAL" | "EMAIL" | "CHAT" | "WHATSAPP";
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string | null;
  closedAt?: string | null;
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

const channelLabels: Record<NonNullable<Ticket["canal"]>, string> = {
  PORTAL: "Portal",
  EMAIL: "Email",
  CHAT: "Chat",
  WHATSAPP: "WhatsApp",
};

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Ticket["priority"]>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | NonNullable<Ticket["canal"]>>("all");
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canEdit = ["ADMIN", "SUPERVISOR"].includes(role ?? "");

  const { data, error, isLoading, mutate } = useSWR<Ticket[]>("/api/tickets", fetcher, {
    refreshInterval: 12_000,
  });

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    return data.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.folioFormateado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesChannel =
        channelFilter === "all" || ticket.canal === channelFilter || !ticket.canal;
      return matchesSearch && matchesStatus && matchesPriority && matchesChannel;
    });
  }, [channelFilter, data, priorityFilter, searchTerm, statusFilter]);

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

  const handleAprobarTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar navegar al detalle

    if (!canEdit) {
      toast.error("No tienes permisos para aprobar tickets");
      return;
    }

    if (!confirm("¿Estás seguro de finalizar este ticket?")) {
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FINALIZADO" }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al aprobar ticket");
        return;
      }

      toast.success("Ticket finalizado correctamente");
      mutate(); // Recargar lista de tickets
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al aprobar ticket");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Gestión centralizada</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">Controla tus incidencias con filtros dinámicos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 disabled:border-white/20 disabled:text-slate-300"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Button
            asChild
            size="sm"
            variant="primary"
          >
            <Link href="/tickets/nuevo">
              <TicketPlus className="mr-2 h-4 w-4" />
              Nuevo Ticket
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">Filtros</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                Busca por título o ID y filtra por estado o prioridad
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 pl-8 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300"
                    placeholder="Buscar por título o ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="CREADO">Creado</SelectItem>
                    <SelectItem value="ASIGNADO">Asignado</SelectItem>
                    <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                    <SelectItem value="PENDIENTE_VALIDACION">Pendiente de validacion</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    <SelectItem value="REABIERTO">Reabierto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
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
              <div>
                <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los canales</SelectItem>
                    <SelectItem value="PORTAL">Portal</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="CHAT">Chat</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Listado de tickets</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Información en tiempo real desde la base de datos
                </CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                variant="primary"
              >
                <Link href="/tickets/nuevo">
                  Crear nuevo
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {error && <p className="text-sm text-red-600 dark:text-red-300">{error.message}</p>}
              {isLoading && <p className="text-sm text-slate-800 dark:text-slate-200">Cargando...</p>}
              {!isLoading && !error && filteredTickets.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-6 text-center text-sm text-slate-800 dark:text-slate-200">
                  No hay tickets para mostrar. Crea uno nuevo para comenzar.
                </div>
              )}

              {!error && filteredTickets.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 shadow-lg">
                  <Table>
                    <TableHeader className="bg-white/10">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">ID</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Título</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Tipo</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Prioridad</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Estado</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">SLA</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Canal</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Asignado</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Creado</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Actualizado</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-white/5 cursor-pointer" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-200">{ticket.folioFormateado}</TableCell>
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
                          <TableCell className="text-slate-600 dark:text-slate-200">
                            {ticket.canal ? channelLabels[ticket.canal] : "Portal"}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{ticket.assignee || "Sin asignar"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{formatDate(ticket.createdAt)}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{formatDate(ticket.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            {canEdit && ticket.status === "PENDIENTE_VALIDACION" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleAprobarTicket(ticket.id, e)}
                                className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                            )}
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
