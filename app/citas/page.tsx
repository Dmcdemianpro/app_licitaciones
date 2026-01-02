"use client";

import { useState } from "react";
import useSWR from "swr";
import { Calendar, Clock, MapPin, Plus, User, Users, Video } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar las citas");
  return res.json();
};

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

export default function CitasPage() {
  const [estadoFilter, setEstadoFilter] = useState("all");

  const { data, error, isLoading } = useSWR(
    `/api/citas${estadoFilter !== "all" ? `?estado=${estadoFilter}` : ""}`,
    fetcher,
    { refreshInterval: 20000 }
  );

  const citas = (data?.citas as any[]) ?? [];

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

  const citasProximas = citas.filter((c) => {
    const fechaInicio = new Date(c.fechaInicio);
    const ahora = new Date();
    return fechaInicio > ahora && c.estado !== "CANCELADA";
  }).length;

  const citasHoy = citas.filter((c) => {
    const fechaInicio = new Date(c.fechaInicio);
    const ahora = new Date();
    return (
      fechaInicio.getDate() === ahora.getDate() &&
      fechaInicio.getMonth() === ahora.getMonth() &&
      fechaInicio.getFullYear() === ahora.getFullYear()
    );
  }).length;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Citas y eventos</p>
            <h1 className="text-3xl font-bold text-white">Agenda del equipo</h1>
            <p className="text-sm text-slate-200">Programa y registra tus reuniones.</p>
          </div>
        </div>
        <Button variant="default" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/citas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </header>

      <div className="flex-1 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Citas</p>
                    <p className="text-2xl font-bold text-white">{citas.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Próximas</p>
                    <p className="text-2xl font-bold text-blue-400">{citasProximas}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Hoy</p>
                    <p className="text-2xl font-bold text-green-400">{citasHoy}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription className="text-slate-300">
                Filtra las citas por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[200px] border-white/20 bg-white/10 text-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PROGRAMADA">Programada</SelectItem>
                  <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Citas List */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Lista de Citas</CardTitle>
              <CardDescription className="text-slate-300">
                Todas las citas registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-sm text-red-300">No se pudo obtener citas.</p>}
              {isLoading && <p className="text-sm text-slate-300">Cargando citas...</p>}
              {!isLoading && citas.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
                  <Calendar className="h-10 w-10 text-indigo-300" />
                  <div>
                    <p className="text-base font-semibold text-white">Sin citas registradas</p>
                    <p className="text-sm text-slate-300 mt-2">
                      Crea tu primera cita para comenzar a gestionar tu agenda
                    </p>
                  </div>
                  <Button variant="default" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
                    <Link href="/citas/nueva">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primera cita
                    </Link>
                  </Button>
                </div>
              )}

              {!error && citas.length > 0 && (
                <div className="space-y-4">
                  {citas.map((cita) => (
                    <Card
                      key={cita.id}
                      className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur hover:bg-white/10 transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-xl font-semibold text-white">{cita.titulo}</h3>
                                <Badge className={getEstadoColor(cita.estado)}>
                                  {estadoLabels[cita.estado] || cita.estado}
                                </Badge>
                                <Badge variant="outline" className="border-white/20 text-slate-300">
                                  {tipoLabels[cita.tipo] || cita.tipo}
                                </Badge>
                              </div>
                            </div>

                            {cita.descripcion && (
                              <p className="text-sm text-slate-300">{cita.descripcion}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                <span>{formatDate(cita.fechaInicio)}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Clock className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                <span>
                                  {formatTime(cita.fechaInicio)} - {formatTime(cita.fechaFin)}
                                </span>
                              </div>

                              {cita.ubicacion && (
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                  <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                  <span className="truncate">{cita.ubicacion}</span>
                                </div>
                              )}

                              {cita.urlReunion && (
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                  <Video className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                  <a
                                    href={cita.urlReunion}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 truncate"
                                  >
                                    Unirse
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span>Organizador: {cita.organizador?.name || "Desconocido"}</span>
                              </div>
                              {cita.participantes && cita.participantes.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3 flex-shrink-0" />
                                  <span>{cita.participantes.length} participante(s)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
