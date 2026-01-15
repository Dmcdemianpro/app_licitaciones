"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, RefreshCcw, Search, TicketPlus, CheckCircle, Clock } from "lucide-react";
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

type Ticket = {
  id: string;
  folio: number;
  folioFormateado: string;
  title: string;
  description?: string | null;
  type: string;
  priority: "ALTA" | "MEDIA" | "BAJA";
  status: "CREADO" | "ASIGNADO" | "INICIADO" | "FINALIZADO";
  assignee?: string | null;
  createdAt: string;
  updatedAt: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar la lista de tickets");
  return res.json();
};

const statusLabels: Record<Ticket["status"], string> = {
  CREADO: "Creado",
  ASIGNADO: "Asignado",
  INICIADO: "Iniciado",
  FINALIZADO: "Finalizado",
};

const priorityLabels: Record<Ticket["priority"], string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Ticket["priority"]>("all");
  const { data: session } = useSession();
  const canEdit = ["ADMIN", "SUPERVISOR"].includes(session?.user?.role ?? "");

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
      case "INICIADO":
        return "secondary";
      case "FINALIZADO":
      default:
        return "outline";
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "short" }).format(new Date(value));

  // Calcular minutos transcurridos desde la creación del ticket
  const getElapsedMinutes = (createdAt: string): number => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convertir a minutos
  };

  // Obtener color del semáforo basado en tiempo transcurrido
  const getTimeIndicatorColor = (minutes: number): "green" | "yellow" | "red" => {
    if (minutes <= 30) return "green";
    if (minutes <= 60) return "yellow";
    return "red";
  };

  // Formatear tiempo transcurrido de forma legible
  const formatElapsedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
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

  const handleFinalizarTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar navegar al detalle

    if (!canEdit) {
      toast.error("No tienes permisos para finalizar tickets");
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
        toast.error(data.error || "Error al finalizar ticket");
        return;
      }

      toast.success("Ticket finalizado correctamente");
      mutate(); // Recargar lista de tickets
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al finalizar ticket");
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
            <CardContent className="grid gap-4 md:grid-cols-3">
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
                    <SelectItem value="INICIADO">Iniciado</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
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
                        <TableHead className="font-semibold text-slate-900 dark:text-white">Tiempo Abierto</TableHead>
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
                            {ticket.status !== "FINALIZADO" && (() => {
                              const minutes = getElapsedMinutes(ticket.createdAt);
                              const color = getTimeIndicatorColor(minutes);
                              return (
                                <div className="flex items-center gap-2">
                                  <div className={`h-3 w-3 rounded-full ${
                                    color === "green" ? "bg-green-500" :
                                    color === "yellow" ? "bg-yellow-500" :
                                    "bg-red-500"
                                  }`} />
                                  <span className="text-sm text-slate-600 dark:text-slate-200">
                                    {formatElapsedTime(minutes)}
                                  </span>
                                </div>
                              );
                            })()}
                            {ticket.status === "FINALIZADO" && (
                              <span className="text-sm text-slate-400">Finalizado</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{ticket.assignee || "Sin asignar"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{formatDate(ticket.createdAt)}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-200">{formatDate(ticket.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            {canEdit && ticket.status !== "FINALIZADO" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleFinalizarTicket(ticket.id, e)}
                                className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Finalizar
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
