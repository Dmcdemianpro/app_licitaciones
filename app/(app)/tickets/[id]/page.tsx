"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Send,
  MessageCircle,
  Star,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  UserCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useSWR from "swr";

const statusLabels: Record<string, string> = {
  CREADO: "Creado",
  ASIGNADO: "Asignado",
  EN_PROGRESO: "En progreso",
  PENDIENTE_VALIDACION: "Pendiente de validacion",
  FINALIZADO: "Finalizado",
  REABIERTO: "Reabierto",
};

const priorityLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

type TicketSla = {
  responseStatus: "ok" | "warning" | "breached" | "met" | "none";
  resolutionStatus: "ok" | "warning" | "breached" | "met" | "none";
  overallStatus: "ok" | "warning" | "breached" | "met" | "none";
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  responseRemainingMinutes: number | null;
  resolutionRemainingMinutes: number | null;
};

const slaLabels: Record<TicketSla["overallStatus"], string> = {
  ok: "En tiempo",
  warning: "Por vencer",
  breached: "Vencido",
  met: "Cumplido",
  none: "Sin SLA",
};

const channelLabels: Record<string, string> = {
  PORTAL: "Portal",
  EMAIL: "Email",
  CHAT: "Chat",
  WHATSAPP: "WhatsApp",
};

const auditActionLabels: Record<string, string> = {
  CREATE: "Ticket creado",
  UPDATE: "Actualizacion",
  DELETE: "Ticket eliminado",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "CREADO":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "ASIGNADO":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "EN_PROGRESO":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "PENDIENTE_VALIDACION":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "FINALIZADO":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "REABIERTO":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "ALTA":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "MEDIA":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "BAJA":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30";
  }
};

type Ticket = {
  id: string;
  folio: number;
  folioFormateado: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  assignee: string | null;
  canal?: "PORTAL" | "EMAIL" | "CHAT" | "WHATSAPP";
  externalRef?: string | null;
  departamento?: {
    id: string;
    nombre: string;
    codigo: string | null;
    color: string | null;
  } | null;
  unidad?: {
    id: string;
    nombre: string;
    codigo: string | null;
    departamentoId: string | null;
  } | null;
  parentTicket?: {
    id: string;
    folio: number;
    title: string;
    status: string;
  } | null;
  childTickets?: Array<{
    id: string;
    folio: number;
    title: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string | null;
  startedAt?: string | null;
  pendingValidationAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  firstResponseAt?: string | null;
  sla?: TicketSla;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type AuditEntry = {
  id: string;
  accion: string;
  cambios: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar los datos");
  return res.json();
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMotivo, setDeleteMotivo] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Notes
  const [notaContenido, setNotaContenido] = useState("");
  const [submittingNota, setSubmittingNota] = useState(false);
  const { data: notasData, mutate: mutateNotas } = useSWR(
    `/api/tickets/${id}/notas`,
    fetcher
  );
  const { data: macrosData } = useSWR(
    "/api/automatizacion/macros?entidad=TICKET&soloActivos=true",
    fetcher
  );
  const macros = macrosData?.macros ?? [];
  const [macroSeleccionada, setMacroSeleccionada] = useState("");
  const { data: mensajesData, mutate: mutateMensajes } = useSWR(
    `/api/tickets/${id}/mensajes`,
    fetcher
  );
  const [mensajeContenido, setMensajeContenido] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [mensajeInterno, setMensajeInterno] = useState(false);
  const { data: csatData, mutate: mutateCsat } = useSWR(
    `/api/tickets/${id}/csat`,
    fetcher
  );
  const [csatRating, setCsatRating] = useState<number | null>(null);
  const [csatComment, setCsatComment] = useState("");
  const [sendingCsat, setSendingCsat] = useState(false);

  // History
  const { data: historialData } = useSWR(`/api/tickets/${id}/historial`, fetcher);

  // Documents
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const { data: docsData, mutate: mutateDocs } = useSWR(
    `/api/tickets/${id}/documentos`,
    fetcher
  );

  // Users for assignment
  const { data: usersData } = useSWR(canEdit ? "/api/usuarios" : null, fetcher);
  const { data: gruposData } = useSWR(
    canEdit
      ? "/api/departamentos?incluirUnidades=true&incluirUsuarios=false&soloActivos=true"
      : null,
    fetcher
  );
  const departamentos = gruposData?.departamentos ?? [];
  const [departamentoId, setDepartamentoId] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [savingGrupo, setSavingGrupo] = useState(false);
  const [parentTicketId, setParentTicketId] = useState("");
  const [savingParent, setSavingParent] = useState(false);
  const departamentoSeleccionado = departamentos.find(
    (dep: any) => dep.id === departamentoId
  );
  const unidades = departamentoSeleccionado?.unidades ?? [];
  const [assigningUser, setAssigningUser] = useState(false);
  const [editValues, setEditValues] = useState({
    title: "",
    description: "",
    type: "",
    priority: "MEDIA",
    status: "CREADO",
    assignee: "",
  });
  const [savingEdits, setSavingEdits] = useState(false);
  const isAssignee = ticket?.assignedTo?.id === session?.user?.id;
  const isOwner = ticket?.owner?.id === session?.user?.id;
  const canWork = role === "USER" && isAssignee;
  const canSeeInternalMessages = role === "ADMIN" || role === "SUPERVISOR" || isAssignee;

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar el ticket");
        }
        const data = await res.json();
        setTicket(data.ticket);
      } catch (err) {
        setError("No se pudo cargar el ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (!ticket) return;
    setEditValues({
      title: ticket.title ?? "",
      description: ticket.description ?? "",
      type: ticket.type ?? "",
      priority: ticket.priority ?? "MEDIA",
      status: ticket.status ?? "CREADO",
      assignee: ticket.assignee ?? "",
    });
    setDepartamentoId(ticket.departamento?.id ?? "");
    setUnidadId(ticket.unidad?.id ?? "");
    setParentTicketId(ticket.parentTicket?.id ?? "");
  }, [ticket]);

  const handleChangeStatus = async (newStatus: string) => {
    const isAssignee = ticket?.assignedTo?.id === session?.user?.id;
    const isUserAction = role === "USER";
    const canWork = isUserAction && isAssignee;

    if (isUserAction && !canWork) {
      alert("No tienes permisos para cambiar el estado");
      return;
    }

    if (!isUserAction && !canEdit) {
      alert("No tienes permisos para cambiar el estado");
      return;
    }

    if (isUserAction && !["EN_PROGRESO", "PENDIENTE_VALIDACION"].includes(newStatus)) {
      alert("No puedes mover el ticket a ese estado");
      return;
    }

    if (!confirm(`¿Estás seguro de cambiar el estado a ${statusLabels[newStatus]}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        alert("No se pudo actualizar el estado del ticket");
      }
    } catch (err) {
      alert("Error al actualizar el estado");
    }
  };

  const handleSaveEdits = async () => {
    if (!canEdit) {
      alert("No tienes permisos para editar este ticket");
      return;
    }

    setSavingEdits(true);
    try {
      const payload = {
        title: editValues.title.trim(),
        description: editValues.description.trim(),
        type: editValues.type.trim(),
        priority: editValues.priority,
        status: editValues.status,
        assignee: editValues.assignee.trim() || null,
      };

      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setTicket(data.ticket);
      } else {
        alert(data.error || "No se pudo actualizar el ticket");
      }
    } catch (err) {
      alert("Error al actualizar el ticket");
    } finally {
      setSavingEdits(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatOptionalDate = (value?: string | null) => {
    if (!value) return "Sin registro";
    return formatDate(value);
  };

  const formatRemaining = (minutes: number | null) => {
    if (minutes == null) return "Sin tiempo";
    if (minutes <= 0) return "Vencido";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getSlaBadgeClass = (status: TicketSla["overallStatus"]) => {
    switch (status) {
      case "ok":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
      case "warning":
        return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
      case "breached":
        return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300";
      case "met":
        return "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-300";
      default:
        return "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300";
    }
  };

  const changeLabels: Record<string, string> = {
    status: "Estado",
    priority: "Prioridad",
    assignee: "Responsable",
    assigneeId: "Responsable",
    title: "Titulo",
    type: "Tipo",
  };

  const formatChangeValue = (key: string, value: any) => {
    if (value == null || value === "") return "Sin asignar";
    if (key === "status") return statusLabels[value] || value;
    if (key === "priority") return priorityLabels[value] || value;
    if (key === "assigneeId") {
      const user = usersData?.users?.find((item: any) => item.id === value);
      return user ? user.name || user.email : value;
    }
    return String(value);
  };

  const summarizeChanges = (entry: AuditEntry) => {
    if (!entry.cambios) return [];
    let parsed: any;
    try {
      parsed = JSON.parse(entry.cambios);
    } catch {
      return [];
    }
    if (parsed.nuevo) return [];
    const items: string[] = [];
    Object.keys(changeLabels).forEach((key) => {
      const change = parsed[key];
      if (!change || !Object.prototype.hasOwnProperty.call(change, "nuevo")) return;
      const before = formatChangeValue(key, change.anterior);
      const after = formatChangeValue(key, change.nuevo);
      if (before !== after) {
        items.push(`${changeLabels[key]}: ${before} -> ${after}`);
      }
    });
    return items;
  };

  const handleInsertMacro = () => {
    const macro = macros.find((item: any) => item.id === macroSeleccionada);
    if (!macro) return;
    setNotaContenido((prev) =>
      prev ? `${prev}\n${macro.contenido}` : macro.contenido
    );
  };

  const handleEnviarMensaje = async () => {
    if (!mensajeContenido.trim()) return;
    setEnviandoMensaje(true);
    try {
      const res = await fetch(`/api/tickets/${id}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: mensajeContenido.trim(),
          esInterno: mensajeInterno && canSeeInternalMessages,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo enviar el mensaje");
        return;
      }
      setMensajeContenido("");
      setMensajeInterno(false);
      mutateMensajes();
    } catch (error) {
      alert("Error al enviar el mensaje");
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleEnviarCsat = async () => {
    if (!csatRating) {
      alert("Selecciona una calificacion");
      return;
    }
    setSendingCsat(true);
    try {
      const res = await fetch(`/api/tickets/${id}/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: csatRating,
          comentario: csatComment.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo enviar la encuesta");
        return;
      }
      setCsatRating(null);
      setCsatComment("");
      mutateCsat();
    } catch (error) {
      alert("Error al enviar la encuesta");
    } finally {
      setSendingCsat(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMotivo.trim()) {
      alert("Debes ingresar un motivo para eliminar el ticket");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: deleteMotivo }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Ticket eliminado correctamente");
        router.push("/tickets");
      } else {
        alert(data.error || "Error al eliminar el ticket");
      }
    } catch (err) {
      alert("Error al eliminar el ticket");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteMotivo("");
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!canEdit) {
      alert("No tienes permisos para asignar tickets");
      return;
    }

    setAssigningUser(true);
    try {
      const actualUserId = userId === "UNASSIGNED" ? null : userId;
      const shouldAssign =
        actualUserId && ["CREADO", "REABIERTO"].includes(ticket?.status ?? "");
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: actualUserId,
          status: shouldAssign ? "ASIGNADO" : ticket?.status
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        alert("No se pudo asignar el usuario");
      }
    } catch (err) {
      alert("Error al asignar usuario");
    } finally {
      setAssigningUser(false);
    }
  };

  const handleGuardarGrupo = async () => {
    if (!canEdit) {
      alert("No tienes permisos para actualizar el grupo");
      return;
    }
    setSavingGrupo(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departamentoId: departamentoId || null,
          unidadId: unidadId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo actualizar el grupo");
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (error) {
      alert("Error al actualizar el grupo");
    } finally {
      setSavingGrupo(false);
    }
  };

  const handleGuardarParent = async () => {
    if (!canEdit) {
      alert("No tienes permisos para actualizar la relacion");
      return;
    }
    setSavingParent(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentTicketId: parentTicketId.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo actualizar la relacion");
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (error) {
      alert("Error al actualizar la relacion");
    } finally {
      setSavingParent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Detalle del ticket</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Detalle del ticket</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-300">{error || "Ticket no encontrado"}</p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
                <Link href="/tickets">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a tickets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const historial = (historialData?.historial ?? []) as AuditEntry[];
  const responseStatus = (ticket.sla?.responseStatus ?? "none") as TicketSla["overallStatus"];
  const resolutionStatus = (ticket.sla?.resolutionStatus ?? "none") as TicketSla["overallStatus"];
  const responseDueAt = ticket.sla?.responseDueAt ?? null;
  const resolutionDueAt = ticket.sla?.resolutionDueAt ?? null;
  const responseRemaining = ticket.sla?.responseRemainingMinutes ?? null;
  const resolutionRemaining = ticket.sla?.resolutionRemainingMinutes ?? null;
  const csatSurvey = csatData?.survey ?? null;
  const canSendCsat = Boolean(isOwner && ticket.status === "FINALIZADO" && !csatSurvey);
  const timeFields = [
    { label: "Asignado", value: ticket.assignedAt },
    { label: "Inicio", value: ticket.startedAt },
    { label: "En validacion", value: ticket.pendingValidationAt },
    { label: "Finalizado", value: ticket.closedAt },
    { label: "Reabierto", value: ticket.reopenedAt },
    { label: "Primera respuesta", value: ticket.firstResponseAt },
  ];
  const grupoChanged =
    (ticket.departamento?.id ?? "") !== departamentoId ||
    (ticket.unidad?.id ?? "") !== unidadId;
  const parentChanged =
    (ticket.parentTicket?.id ?? "") !== parentTicketId.trim();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{ticket.title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200">ID: {ticket.folioFormateado}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
            <Link href="/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          {(session?.user as any)?.role === "ADMIN" && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Información Principal */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(ticket.status)}>
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      Prioridad: {priorityLabels[ticket.priority] || ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-slate-600 dark:text-slate-300">
                      Canal: {ticket.canal ? channelLabels[ticket.canal] : "Portal"}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-slate-600 dark:text-slate-300">
                      {ticket.type}
                    </Badge>
                  </div>
                </div>
              </div>
              {ticket.description && (
                <CardDescription className="text-slate-300 mt-4 whitespace-pre-wrap">
                  {ticket.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Creado</p>
                  <p className="font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Última actualización</p>
                  <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Canal</p>
                  <p className="font-medium">{ticket.canal ? channelLabels[ticket.canal] : "Portal"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Referencia externa</p>
                  <p className="font-medium">{ticket.externalRef || "Sin referencia"}</p>
                </div>
              </div>

              {/* Acciones de Estado */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {canEdit && ticket.status === "CREADO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("ASIGNADO")}
                      disabled={!ticket.assignedTo}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Asignar
                    </Button>
                  )}
                  {canWork && (ticket.status === "ASIGNADO" || ticket.status === "REABIERTO") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("EN_PROGRESO")}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Iniciar trabajo
                    </Button>
                  )}
                  {canWork && ticket.status === "EN_PROGRESO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("PENDIENTE_VALIDACION")}
                      className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar a revision
                    </Button>
                  )}
                  {canEdit && ticket.status === "PENDIENTE_VALIDACION" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus("FINALIZADO")}
                        className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus("REABIERTO")}
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Reabrir
                      </Button>
                    </>
                  )}
                  {ticket.status === "FINALIZADO" && (
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ticket finalizado</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">SLA y tiempos</CardTitle>
              <CardDescription className="text-slate-300">
                Seguimiento de respuesta, resolucion y tiempos clave del ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">SLA respuesta</p>
                    <Badge variant="outline" className={getSlaBadgeClass(responseStatus)}>
                      {slaLabels[responseStatus]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Vence: {formatOptionalDate(responseDueAt)}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {responseRemaining == null && ticket.firstResponseAt
                      ? "Respondido"
                      : formatRemaining(responseRemaining)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">SLA resolucion</p>
                    <Badge variant="outline" className={getSlaBadgeClass(resolutionStatus)}>
                      {slaLabels[resolutionStatus]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Vence: {formatOptionalDate(resolutionDueAt)}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {resolutionRemaining == null && ticket.status === "FINALIZADO"
                      ? "Cerrado"
                      : formatRemaining(resolutionRemaining)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {timeFields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-3"
                  >
                    <p className="text-xs text-slate-500">{field.label}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formatOptionalDate(field.value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {canEdit && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Editar ticket</CardTitle>
                <CardDescription className="text-slate-300">
                  Actualiza la informacion del ticket
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Titulo</Label>
                  <Input
                    value={editValues.title}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, title: e.target.value }))}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripcion</Label>
                  <Textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Input
                    value={editValues.type}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, type: e.target.value }))}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={editValues.priority}
                    onValueChange={(value) => setEditValues((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                      <SelectItem value="BAJA">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={editValues.status}
                    onValueChange={(value) => setEditValues((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREADO">Creado</SelectItem>
                      <SelectItem value="ASIGNADO">Asignado</SelectItem>
                      <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                      <SelectItem value="PENDIENTE_VALIDACION">Pendiente de validacion</SelectItem>
                      <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                      <SelectItem value="REABIERTO">Reabierto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsable (texto)</Label>
                  <Input
                    value={editValues.assignee}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, assignee: e.target.value }))}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    onClick={handleSaveEdits}
                    disabled={savingEdits}
                    className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                  >
                    {savingEdits ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creador y Asignado */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-indigo-400" />
                  Creador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{ticket.owner.name || "Sin nombre"}</p>
                  <p className="text-sm text-slate-400">{ticket.owner.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                  Asignado a
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.assignedTo ? (
                  <div className="space-y-1">
                    <p className="font-medium">{ticket.assignedTo.name || "Sin nombre"}</p>
                    <p className="text-sm text-slate-400">{ticket.assignedTo.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin asignar</p>
                )}

                {/* Selector de usuario para asignar/reasignar */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <Label className="text-sm font-medium">Asignar o cambiar usuario</Label>
                  <Select
                    value={ticket.assignedTo?.id || ""}
                    onValueChange={handleAssignUser}
                    disabled={!canEdit || assigningUser || !usersData?.users}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder={assigningUser ? "Asignando..." : "Seleccionar usuario"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Sin asignar</SelectItem>
                      {usersData?.users?.filter((u: any) => u.activo).map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} {user.role === "ADMIN" ? "(Admin)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Grupo y relacion</CardTitle>
                <CardDescription className="text-slate-300">
                  Controla el acceso y vincula tickets relacionados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Departamento</Label>
                  {canEdit ? (
                    <Select
                      value={departamentoId || "none"}
                      onValueChange={(value) => {
                        const next = value === "none" ? "" : value;
                        setDepartamentoId(next);
                        if (!next) {
                          setUnidadId("");
                          return;
                        }
                        const nextDept = departamentos.find((dep: any) => dep.id === next);
                        const nextUnits = nextDept?.unidades ?? [];
                        if (unidadId && !nextUnits.some((unidad: any) => unidad.id === unidadId)) {
                          setUnidadId("");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin departamento</SelectItem>
                        {departamentos.map((dep: any) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {dep.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {ticket.departamento?.nombre || "Sin departamento"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Unidad</Label>
                  {canEdit ? (
                    <Select
                      value={unidadId || "none"}
                      onValueChange={(value) => setUnidadId(value === "none" ? "" : value)}
                      disabled={!departamentoSeleccionado}
                    >
                      <SelectTrigger className="w-full border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin unidad</SelectItem>
                        {unidades.map((unidad: any) => (
                          <SelectItem key={unidad.id} value={unidad.id}>
                            {unidad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {ticket.unidad?.nombre || "Sin unidad"}
                    </p>
                  )}
                </div>
                {canEdit && grupoChanged && (
                  <Button
                    onClick={handleGuardarGrupo}
                    disabled={savingGrupo}
                    className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                  >
                    {savingGrupo ? "Guardando..." : "Guardar grupo"}
                  </Button>
                )}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <Label className="text-xs text-slate-400">Ticket padre</Label>
                  {ticket.parentTicket ? (
                    <Link
                      href={`/tickets/${ticket.parentTicket.id}`}
                      className="text-sm text-indigo-600 dark:text-indigo-300 hover:underline"
                    >
                      {ticket.parentTicket.title} (#{ticket.parentTicket.folio})
                    </Link>
                  ) : (
                    <p className="text-sm text-slate-500">Sin ticket padre</p>
                  )}
                  {canEdit && (
                    <div className="space-y-2">
                      <Input
                        value={parentTicketId}
                        onChange={(e) => setParentTicketId(e.target.value)}
                        placeholder="ID del ticket padre"
                        className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                      />
                      {parentChanged && (
                        <Button
                          onClick={handleGuardarParent}
                          disabled={savingParent}
                          className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                        >
                          {savingParent ? "Guardando..." : "Guardar relacion"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Tickets hijos</Label>
                  {ticket.childTickets && ticket.childTickets.length > 0 ? (
                    <div className="space-y-1">
                      {ticket.childTickets.map((child) => (
                        <Link
                          key={child.id}
                          href={`/tickets/${child.id}`}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300"
                        >
                          #{child.folio} - {child.title}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Sin tickets relacionados.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-indigo-400" />
                Conversacion
              </CardTitle>
              <CardDescription className="text-slate-300">
                Mensajes hacia el solicitante por canal {ticket.canal ? channelLabels[ticket.canal] : "Portal"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                  placeholder="Escribe un mensaje..."
                  rows={3}
                  value={mensajeContenido}
                  onChange={(e) => setMensajeContenido(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {canSeeInternalMessages && (
                    <div className="flex items-center gap-2">
                      <Switch checked={mensajeInterno} onCheckedChange={setMensajeInterno} />
                      <Label className="text-sm text-slate-600 dark:text-slate-300">
                        Mensaje interno
                      </Label>
                    </div>
                  )}
                  <Button
                    onClick={handleEnviarMensaje}
                    disabled={enviandoMensaje || !mensajeContenido.trim()}
                    className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {enviandoMensaje ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {mensajesData?.mensajes?.length > 0 ? (
                  mensajesData.mensajes.map((mensaje: any) => (
                    <div
                      key={mensaje.id}
                      className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{mensaje.direccion === "OUT" ? "Salida" : "Entrada"}</span>
                          {mensaje.esInterno && canSeeInternalMessages && (
                            <Badge variant="secondary">Interno</Badge>
                          )}
                          <span>{mensaje.canal ? channelLabels[mensaje.canal] : "Portal"}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(mensaje.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {mensaje.contenido}
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        {(mensaje.autor?.name || mensaje.autor?.email || mensaje.autorNombre || "Sistema")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    Aun no hay mensajes en este hilo.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-amber-400" />
                Satisfaccion
              </CardTitle>
              <CardDescription className="text-slate-300">
                Evaluacion del solicitante al cierre del ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {csatSurvey ? (
                <div className="space-y-2 rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{csatSurvey.rating}/5</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Calificacion registrada
                    </span>
                  </div>
                  {csatSurvey.comentario && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {csatSurvey.comentario}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {csatSurvey.createdBy?.name || csatSurvey.createdBy?.email || "Solicitante"}
                  </p>
                </div>
              ) : canSendCsat ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={csatRating === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCsatRating(value)}
                        className={csatRating === value ? "bg-amber-500 text-white hover:bg-amber-600" : "border-white/20 text-slate-700 dark:text-slate-200 hover:bg-white/10"}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    placeholder="Comentario (opcional)"
                    rows={3}
                    value={csatComment}
                    onChange={(e) => setCsatComment(e.target.value)}
                  />
                  <Button
                    onClick={handleEnviarCsat}
                    disabled={sendingCsat}
                    className="bg-amber-500 text-white hover:bg-amber-600"
                  >
                    {sendingCsat ? "Enviando..." : "Enviar encuesta"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-6 text-center text-sm text-slate-500 dark:text-slate-300">
                  No hay encuesta registrada.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Linea de tiempo</CardTitle>
              <CardDescription className="text-slate-300">
                Registro de cambios y actividades sobre el ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!historialData && (
                <p className="text-sm text-slate-400">Cargando historial...</p>
              )}
              {historialData && historial.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                  No hay movimientos registrados aun.
                </div>
              )}
              {historial.map((entry) => {
                const summary = summarizeChanges(entry);
                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {auditActionLabels[entry.accion] || entry.accion}
                        </p>
                        <p className="text-xs text-slate-500">
                          por {entry.user?.name || entry.user?.email || "Sistema"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
                    </div>
                    {summary.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {summary.map((line, index) => (
                          <p
                            key={`${entry.id}-${index}`}
                            className="text-xs text-slate-600 dark:text-slate-300"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Bitacora */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-400" />
                Bitacora
              </CardTitle>
              <CardDescription className="text-slate-300">
                Agrega notas sobre el progreso o solución del ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {macros.length > 0 && (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Select value={macroSeleccionada} onValueChange={setMacroSeleccionada}>
                      <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white md:w-[320px]">
                        <SelectValue placeholder="Usar macro" />
                      </SelectTrigger>
                      <SelectContent>
                        {macros.map((macro: any) => (
                          <SelectItem key={macro.id} value={macro.id}>
                            {macro.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleInsertMacro}
                      disabled={!macroSeleccionada}
                      className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                    >
                      Insertar macro
                    </Button>
                  </div>
                )}
                <Textarea
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                  placeholder="Escribe un avance..."
                  rows={3}
                  value={notaContenido}
                  onChange={(e) => setNotaContenido(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    if (!notaContenido.trim()) return;
                    setSubmittingNota(true);
                    try {
                      await fetch(`/api/tickets/${id}/notas`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contenido: notaContenido }),
                      });
                      setNotaContenido("");
                      mutateNotas();
                    } catch (err) {
                      alert("Error al guardar la nota");
                    } finally {
                      setSubmittingNota(false);
                    }
                  }}
                  disabled={submittingNota || !notaContenido.trim()}
                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submittingNota ? "Guardando..." : "Agregar avance"}
                </Button>
              </div>

              <div className="space-y-3">
                {notasData?.notas?.length > 0 ? (
                  notasData.notas.map((nota: any) => (
                    <div
                      key={nota.id}
                      className="rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4"
                    >
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {nota.contenido}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <User className="h-3 w-3" />
                        <span>{nota.autor?.name || "Desconocido"}</span>
                        <span>•</span>
                        <span>
                          {new Date(nota.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                    <FileText className="h-8 w-8 text-slate-500" />
                    <p className="text-sm text-slate-400">
                      No hay notas aún. Agrega la primera nota arriba.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-indigo-400" />
                Documentos
              </CardTitle>
              <CardDescription className="text-slate-300">
                Sube documentos relacionados con el ticket (capturas, logs, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Subir documento</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.log,.png,.jpg,.jpeg"
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-indigo-700"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploadingDoc(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);

                      await fetch(`/api/tickets/${id}/documentos`, {
                        method: "POST",
                        body: formData,
                      });

                      mutateDocs();
                      e.target.value = "";
                    } catch (err) {
                      alert("Error al subir el documento");
                    } finally {
                      setUploadingDoc(false);
                    }
                  }}
                  disabled={uploadingDoc}
                />
                {uploadingDoc && (
                  <p className="text-sm text-slate-400">Subiendo documento...</p>
                )}
              </div>

              <div className="space-y-3">
                {docsData?.documentos?.length > 0 ? (
                  docsData.documentos.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-500/20 p-2">
                          <FileText className="h-5 w-5 text-indigo-300" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.nombre}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{(doc.tamano / 1024).toFixed(2)} KB</span>
                            <span>•</span>
                            <span>{doc.uploadedBy?.name || "Desconocido"}</span>
                            <span>•</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString("es-CL")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                      >
                        <a href={doc.rutaArchivo} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                    <Upload className="h-8 w-8 text-slate-500" />
                    <p className="text-sm text-slate-400">
                      No hay documentos aún. Sube el primer documento arriba.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ticket?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
              Esta acción marcará el ticket como eliminado. La información se ocultará pero se mantendrá para auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo de eliminación *
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ingresa el motivo por el cual se eliminará este ticket..."
              value={deleteMotivo}
              onChange={(e) => setDeleteMotivo(e.target.value)}
              rows={3}
              className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || !deleteMotivo.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar ticket
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
