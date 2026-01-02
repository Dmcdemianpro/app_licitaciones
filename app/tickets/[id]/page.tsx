"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Send,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSWR from "swr";

const statusLabels: Record<string, string> = {
  CREADO: "Creado",
  ASIGNADO: "Asignado",
  INICIADO: "Iniciado",
  FINALIZADO: "Finalizado",
};

const priorityLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "CREADO":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "ASIGNADO":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "INICIADO":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "FINALIZADO":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
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
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
};

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar los datos");
  return res.json();
};

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes
  const [notaContenido, setNotaContenido] = useState("");
  const [submittingNota, setSubmittingNota] = useState(false);
  const { data: notasData, mutate: mutateNotas } = useSWR(
    `/api/tickets/${params.id}/notas`,
    fetcher
  );

  // Documents
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const { data: docsData, mutate: mutateDocs } = useSWR(
    `/api/tickets/${params.id}/documentos`,
    fetcher
  );

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${params.id}`);
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
  }, [params.id]);

  const handleChangeStatus = async (newStatus: string) => {
    if (!confirm(`¿Estás seguro de cambiar el estado a ${statusLabels[newStatus]}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
        <header className="flex items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-white">Detalle del ticket</h1>
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
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
        <header className="flex items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-white">Detalle del ticket</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-300">{error || "Ticket no encontrado"}</p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-700">
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Tickets</p>
            <h1 className="text-3xl font-bold text-white">{ticket.title}</h1>
            <p className="text-sm text-slate-200">ID: {ticket.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
            <Link href="/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Información Principal */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
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
                    <Badge variant="outline" className="border-white/20 text-slate-300">
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Creado</p>
                  <p className="font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Última actualización</p>
                  <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>

              {/* Acciones de Estado */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-slate-300 mb-3">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.status === "CREADO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("ASIGNADO")}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Asignar
                    </Button>
                  )}
                  {ticket.status === "ASIGNADO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("INICIADO")}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Iniciar
                    </Button>
                  )}
                  {ticket.status === "INICIADO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus("FINALIZADO")}
                      className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar
                    </Button>
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

          {/* Creador y Asignado */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
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

            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                  Asignado a
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.assignedTo ? (
                  <div className="space-y-1">
                    <p className="font-medium">{ticket.assignedTo.name || "Sin nombre"}</p>
                    <p className="text-sm text-slate-400">{ticket.assignedTo.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin asignar</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-400" />
                Notas
              </CardTitle>
              <CardDescription className="text-slate-300">
                Agrega notas sobre el progreso o solución del ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-300"
                  placeholder="Escribe una nota..."
                  rows={3}
                  value={notaContenido}
                  onChange={(e) => setNotaContenido(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    if (!notaContenido.trim()) return;
                    setSubmittingNota(true);
                    try {
                      await fetch(`/api/tickets/${params.id}/notas`, {
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
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submittingNota ? "Guardando..." : "Agregar nota"}
                </Button>
              </div>

              <div className="space-y-3">
                {notasData?.notas?.length > 0 ? (
                  notasData.notas.map((nota: any) => (
                    <div
                      key={nota.id}
                      className="rounded-lg border border-white/15 bg-white/5 p-4"
                    >
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
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
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
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
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
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
                  className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-indigo-700"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploadingDoc(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);

                      await fetch(`/api/tickets/${params.id}/documentos`, {
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
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 p-4"
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
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <a href={doc.rutaArchivo} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
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
    </div>
  );
}
