"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Info,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Users,
  Wrench,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Tipos de eventos disponibles
const TIPOS_EVENTO = [
  { value: "CREACION", label: "Creación", icon: Plus, color: "text-blue-500" },
  { value: "ACTUALIZACION", label: "Actualización", icon: RefreshCw, color: "text-cyan-500" },
  { value: "CAMBIO_ESTADO", label: "Cambio de Estado", icon: Settings, color: "text-purple-500" },
  { value: "INCIDENTE", label: "Incidente", icon: AlertCircle, color: "text-red-500" },
  { value: "CAIDA_SISTEMA", label: "Caída de Sistema", icon: Server, color: "text-red-600" },
  { value: "MANTENIMIENTO", label: "Mantenimiento", icon: Wrench, color: "text-orange-500" },
  { value: "VISITA_TECNICA", label: "Visita Técnica", icon: Users, color: "text-green-500" },
  { value: "REUNION", label: "Reunión", icon: Users, color: "text-indigo-500" },
  { value: "DOCUMENTO_AGREGADO", label: "Documento Agregado", icon: FileText, color: "text-emerald-500" },
  { value: "ADJUDICACION", label: "Adjudicación", icon: CheckCircle2, color: "text-green-600" },
  { value: "CIERRE", label: "Cierre", icon: CheckCircle2, color: "text-slate-500" },
  { value: "EXTENSION_PLAZO", label: "Extensión de Plazo", icon: Clock, color: "text-yellow-500" },
  { value: "NOTA", label: "Nota", icon: FileText, color: "text-slate-400" },
  { value: "OTRO", label: "Otro", icon: Info, color: "text-slate-400" },
];

// Niveles de importancia
const IMPORTANCIAS = [
  { value: "CRITICA", label: "Crítica", color: "bg-red-500", textColor: "text-red-500" },
  { value: "ALTA", label: "Alta", color: "bg-orange-500", textColor: "text-orange-500" },
  { value: "MEDIA", label: "Media", color: "bg-yellow-500", textColor: "text-yellow-500" },
  { value: "BAJA", label: "Baja", color: "bg-blue-500", textColor: "text-blue-500" },
  { value: "INFO", label: "Informativo", color: "bg-slate-500", textColor: "text-slate-400" },
];

// Estados de eventos
const ESTADOS_EVENTO = [
  { value: "REGISTRADO", label: "Registrado", color: "bg-slate-500" },
  { value: "EN_PROGRESO", label: "En Progreso", color: "bg-yellow-500" },
  { value: "RESUELTO", label: "Resuelto", color: "bg-green-500" },
  { value: "CERRADO", label: "Cerrado", color: "bg-slate-600" },
];

interface EventosTimelineProps {
  licitacionId: string;
  onEventoCreado?: () => void;
}

interface Evento {
  id: string;
  tipoEvento: string;
  titulo: string;
  descripcion?: string;
  importancia: string;
  fechaEvento: string;
  fechaResolucion?: string;
  estado: string;
  ticketId?: string;
  ticket?: {
    id: string;
    folio: number;
    title: string;
    status: string;
  };
  creadoPor: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export function EventosTimeline({ licitacionId, onEventoCreado }: EventosTimelineProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroImportancia, setFiltroImportancia] = useState<string>("");

  // Estado del formulario
  const [formEvento, setFormEvento] = useState({
    tipoEvento: "NOTA",
    titulo: "",
    descripcion: "",
    importancia: "MEDIA",
    fechaEvento: new Date().toISOString().slice(0, 16),
    ticketId: "",
    estado: "REGISTRADO",
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/licitaciones/${licitacionId}/eventos`,
    fetcher
  );

  // Fetch tickets para vincular
  const { data: ticketsData } = useSWR('/api/tickets?status=all', fetcher);

  const eventos: Evento[] = data?.eventos || [];

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(evento => {
    if (filtroTipo && evento.tipoEvento !== filtroTipo) return false;
    if (filtroImportancia && evento.importancia !== filtroImportancia) return false;
    return true;
  });

  const handleGuardarEvento = async () => {
    if (!formEvento.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/licitaciones/${licitacionId}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formEvento,
          ticketId: formEvento.ticketId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al registrar evento");
        return;
      }

      toast.success("Evento registrado correctamente");
      setFormEvento({
        tipoEvento: "NOTA",
        titulo: "",
        descripcion: "",
        importancia: "MEDIA",
        fechaEvento: new Date().toISOString().slice(0, 16),
        ticketId: "",
        estado: "REGISTRADO",
      });
      setDialogOpen(false);
      mutate();
      onEventoCreado?.();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar evento");
    } finally {
      setGuardando(false);
    }
  };

  const handleActualizarEstado = async (eventoId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/licitaciones/${licitacionId}/eventos/${eventoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          fechaResolucion: nuevoEstado === "RESUELTO" || nuevoEstado === "CERRADO"
            ? new Date().toISOString()
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al actualizar estado");
        return;
      }

      toast.success("Estado actualizado");
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar estado");
    }
  };

  const getIconoTipo = (tipoEvento: string) => {
    const tipo = TIPOS_EVENTO.find(t => t.value === tipoEvento);
    if (!tipo) return <Info className="h-4 w-4" />;
    const Icon = tipo.icon;
    return <Icon className={`h-4 w-4 ${tipo.color}`} />;
  };

  const getColorImportancia = (importancia: string) => {
    return IMPORTANCIAS.find(i => i.value === importancia)?.color || "bg-slate-500";
  };

  const getTextColorImportancia = (importancia: string) => {
    return IMPORTANCIAS.find(i => i.value === importancia)?.textColor || "text-slate-400";
  };

  const getColorEstado = (estado: string) => {
    return ESTADOS_EVENTO.find(e => e.value === estado)?.color || "bg-slate-500";
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle className="text-slate-900 dark:text-white">
                  Timeline de Eventos
                </CardTitle>
                <Badge variant="outline" className="ml-2">
                  {eventos.length} eventos
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Evento</DialogTitle>
                      <DialogDescription>
                        Registra un evento importante relacionado con esta licitación
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">Tipo de Evento *</label>
                          <select
                            value={formEvento.tipoEvento}
                            onChange={(e) => setFormEvento({ ...formEvento, tipoEvento: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            {TIPOS_EVENTO.map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Importancia *</label>
                          <select
                            value={formEvento.importancia}
                            onChange={(e) => setFormEvento({ ...formEvento, importancia: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            {IMPORTANCIAS.map(imp => (
                              <option key={imp.value} value={imp.value}>{imp.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Título *</label>
                        <Input
                          value={formEvento.titulo}
                          onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
                          placeholder="Ej: Sistema fuera de línea por mantenimiento"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descripción</label>
                        <Textarea
                          value={formEvento.descripcion}
                          onChange={(e) => setFormEvento({ ...formEvento, descripcion: e.target.value })}
                          placeholder="Describe los detalles del evento..."
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">Fecha y Hora del Evento *</label>
                          <Input
                            type="datetime-local"
                            value={formEvento.fechaEvento}
                            onChange={(e) => setFormEvento({ ...formEvento, fechaEvento: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Estado Inicial</label>
                          <select
                            value={formEvento.estado}
                            onChange={(e) => setFormEvento({ ...formEvento, estado: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            {ESTADOS_EVENTO.map(est => (
                              <option key={est.value} value={est.value}>{est.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Vincular a Ticket (opcional)
                        </label>
                        <select
                          value={formEvento.ticketId}
                          onChange={(e) => setFormEvento({ ...formEvento, ticketId: e.target.value })}
                          className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        >
                          <option value="">Sin ticket vinculado</option>
                          {ticketsData?.tickets?.map((ticket: any) => (
                            <option key={ticket.id} value={ticket.id}>
                              #{ticket.folio} - {ticket.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleGuardarEvento}
                        disabled={guardando || !formEvento.titulo.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {guardando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Registrar Evento"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Historial de eventos, incidentes y cambios importantes
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-slate-400">Filtrar por:</span>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
              >
                <option value="">Todos los tipos</option>
                {TIPOS_EVENTO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              <select
                value={filtroImportancia}
                onChange={(e) => setFiltroImportancia(e.target.value)}
                className="rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
              >
                <option value="">Todas las importancias</option>
                {IMPORTANCIAS.map(imp => (
                  <option key={imp.value} value={imp.value}>{imp.label}</option>
                ))}
              </select>
              {(filtroTipo || filtroImportancia) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFiltroTipo("");
                    setFiltroImportancia("");
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            <Separator className="bg-slate-200 dark:bg-white/10" />

            {/* Timeline */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-slate-400">Cargando eventos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                Error al cargar eventos
              </div>
            ) : eventosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-6 py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {eventos.length === 0
                    ? "No hay eventos registrados. Registra el primero para comenzar el tracking."
                    : "No hay eventos que coincidan con los filtros."}
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-white/10" />

                <div className="space-y-4">
                  {eventosFiltrados.map((evento, index) => (
                    <div key={evento.id} className="relative pl-10">
                      {/* Punto del timeline */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full ${getColorImportancia(evento.importancia)} flex items-center justify-center shadow-lg`}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>

                      {/* Card del evento */}
                      <div className={`rounded-lg border ${
                        evento.importancia === "CRITICA"
                          ? "border-red-500/30 bg-red-500/5"
                          : evento.importancia === "ALTA"
                          ? "border-orange-500/30 bg-orange-500/5"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                      } p-4`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getIconoTipo(evento.tipoEvento)}
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {TIPOS_EVENTO.find(t => t.value === evento.tipoEvento)?.label || evento.tipoEvento}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTextColorImportancia(evento.importancia)}`}
                              >
                                {IMPORTANCIAS.find(i => i.value === evento.importancia)?.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs`}
                              >
                                <div className={`w-2 h-2 rounded-full ${getColorEstado(evento.estado)} mr-1`} />
                                {ESTADOS_EVENTO.find(e => e.value === evento.estado)?.label}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {evento.titulo}
                            </h4>
                            {evento.descripcion && (
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {evento.descripcion}
                              </p>
                            )}
                            {evento.ticket && (
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <Link2 className="h-3 w-3 text-indigo-500" />
                                <a
                                  href={`/tickets/${evento.ticket.id}`}
                                  className="text-indigo-500 hover:text-indigo-400"
                                >
                                  Ticket #{evento.ticket.folio}: {evento.ticket.title}
                                </a>
                                <Badge variant="outline" className="text-xs">
                                  {evento.ticket.status}
                                </Badge>
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatFecha(evento.fechaEvento)}
                              </span>
                              <span>Por: {evento.creadoPor?.name || "Usuario"}</span>
                              {evento.fechaResolucion && (
                                <span className="text-green-500">
                                  Resuelto: {formatFecha(evento.fechaResolucion)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Acciones rápidas para cambiar estado */}
                          {evento.estado !== "CERRADO" && (
                            <div className="flex flex-col gap-1">
                              {evento.estado === "REGISTRADO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActualizarEstado(evento.id, "EN_PROGRESO")}
                                  className="text-xs h-7"
                                >
                                  Iniciar
                                </Button>
                              )}
                              {evento.estado === "EN_PROGRESO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActualizarEstado(evento.id, "RESUELTO")}
                                  className="text-xs h-7 text-green-500 border-green-500/30"
                                >
                                  Resolver
                                </Button>
                              )}
                              {evento.estado === "RESUELTO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActualizarEstado(evento.id, "CERRADO")}
                                  className="text-xs h-7"
                                >
                                  Cerrar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
