"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

const estadoLabels: Record<string, string> = {
  PROGRAMADA: "Programada",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const tipoLabels: Record<string, string> = {
  REUNION: "Reunión",
  PRESENTACION: "Presentación",
  VISITA: "Visita",
  ENTREGA: "Entrega",
  OTRO: "Otro",
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "PROGRAMADA":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "CONFIRMADA":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "COMPLETADA":
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    case "CANCELADA":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
};

type Cita = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion: string | null;
  urlReunion: string | null;
  organizador: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  participantes: Array<{
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
};

export default function CitaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCita = async () => {
      try {
        const res = await fetch(`/api/citas/${params.id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la cita");
        }
        const data = await res.json();
        setCita(data.cita);
      } catch (err) {
        setError("No se pudo cargar la cita");
      } finally {
        setLoading(false);
      }
    };

    fetchCita();
  }, [params.id]);

  const handleFinalizar = async () => {
    if (!confirm("¿Estás seguro de que deseas marcar esta cita como completada?")) {
      return;
    }

    try {
      const res = await fetch(`/api/citas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "COMPLETADA" }),
      });

      if (res.ok) {
        const data = await res.json();
        setCita(data.cita);
      } else {
        alert("No se pudo finalizar la cita");
      }
    } catch (err) {
      alert("Error al finalizar la cita");
    }
  };

  const handleEliminar = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/citas/${params.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/citas");
      } else {
        alert("No se pudo eliminar la cita");
      }
    } catch (err) {
      alert("Error al eliminar la cita");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-white">Detalle de cita</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
        <header className="flex items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-white">Detalle de cita</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-300">{error || "Cita no encontrada"}</p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-700">
                <Link href="/citas">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a citas
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-white">{cita.titulo}</h1>
            <p className="text-sm text-slate-200">Información completa de la cita</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
            <Link href="/citas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
            <Link href={`/citas/${params.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {cita.estado !== "COMPLETADA" && cita.estado !== "CANCELADA" && (
            <Button
              variant="outline"
              onClick={handleFinalizar}
              className="border-green-500/30 text-green-300 hover:bg-green-500/10"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleEliminar}
            className="border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Main Info */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{cita.titulo}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getEstadoColor(cita.estado)}>
                      {estadoLabels[cita.estado] || cita.estado}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {tipoLabels[cita.tipo] || cita.tipo}
                    </Badge>
                  </div>
                </div>
              </div>
              {cita.descripcion && (
                <CardDescription className="text-slate-300 mt-4">
                  {cita.descripcion}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 text-slate-300">
                  <Calendar className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Fecha</p>
                    <p className="font-medium">{formatDate(cita.fechaInicio)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Clock className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Horario</p>
                    <p className="font-medium">
                      {formatTime(cita.fechaInicio)} - {formatTime(cita.fechaFin)}
                    </p>
                  </div>
                </div>

                {cita.ubicacion && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="h-5 w-5 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Ubicación</p>
                      <p className="font-medium">{cita.ubicacion}</p>
                    </div>
                  </div>
                )}

                {cita.urlReunion && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Video className="h-5 w-5 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Reunión virtual</p>
                      <a
                        href={cita.urlReunion}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        Unirse a la reunión
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizador y Participantes */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-indigo-400" />
                  Organizador
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cita.organizador ? (
                  <div className="space-y-1">
                    <p className="font-medium">{cita.organizador.name || "Sin nombre"}</p>
                    <p className="text-sm text-slate-400">{cita.organizador.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin organizador asignado</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Participantes ({cita.participantes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cita.participantes.length > 0 ? (
                  <div className="space-y-3">
                    {cita.participantes.map((participante) => (
                      <div key={participante.id} className="space-y-1">
                        <p className="font-medium">{participante.user.name || "Sin nombre"}</p>
                        <p className="text-sm text-slate-400">{participante.user.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin participantes</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Placeholder para Notas y Documentos - se implementará en la siguiente tarea */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Notas y Documentos</CardTitle>
              <CardDescription className="text-slate-300">
                Sección para agregar notas y documentos relacionados con la cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                <p className="text-sm text-slate-300">
                  Funcionalidad de notas y documentos próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
