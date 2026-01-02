"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, FileText, MessageSquarePlus, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function LicitacionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nuevaNota, setNuevaNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/licitaciones/${id}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener la licitación");
      return res.json();
    }
  );

  const licitacion = data?.licitacion;

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim()) {
      toast.error("Debes escribir una nota antes de guardar");
      return;
    }

    setEnviandoNota(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: nuevaNota }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al agregar nota");
        return;
      }

      toast.success("Nota agregada correctamente");
      setNuevaNota("");
      mutate(); // Recargar datos
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar nota");
    } finally {
      setEnviandoNota(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVA":
        return "default";
      case "EN_PREPARACION":
        return "secondary";
      case "ADJUDICADA":
        return "outline";
      case "DESIERTA":
        return "destructive";
      case "CANCELADA":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDaysColor = (days?: number) => {
    if (days === undefined) return "text-slate-300";
    if (days <= 3) return "text-red-300";
    if (days <= 7) return "text-orange-300";
    return "text-emerald-300";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Licitación</p>
              <h1 className="text-3xl font-bold text-white">Cargando...</h1>
            </div>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-300">Cargando detalles de la licitación...</p>
        </div>
      </div>
    );
  }

  if (error || !licitacion) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Licitación</p>
              <h1 className="text-3xl font-bold text-white">Error</h1>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-red-300">No se pudo cargar la licitación</p>
          <Button variant="default" onClick={() => router.push("/licitaciones")} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Licitaciones
          </Button>
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Licitación</p>
            <h1 className="text-3xl font-bold text-white">{licitacion.codigoExterno || "Sin código"}</h1>
            <p className="text-sm text-slate-300">{licitacion.nombre}</p>
          </div>
        </div>
        <Button variant="default" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/licitaciones">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Información general */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Nombre</p>
                  <p className="text-base text-white">{licitacion.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Descripción</p>
                  <p className="text-base text-slate-300">{licitacion.descripcion || "Sin descripción"}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Entidad</p>
                    <p className="text-base text-white">{licitacion.entidad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Tipo</p>
                    <p className="text-base text-white">{licitacion.tipo}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Estado</p>
                    <Badge variant={getStatusColor(licitacion.estado)} className="mt-1 text-white">
                      {licitacion.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Monto Estimado</p>
                    <p className="text-base text-white">
                      {licitacion.montoEstimado
                        ? `${licitacion.moneda || "CLP"} $${(parseFloat(licitacion.montoEstimado) / 1000000).toFixed(1)}M`
                        : "No especificado"}
                    </p>
                  </div>
                </div>
                {licitacion.urlExterna && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Enlace Externo</p>
                    <a
                      href={licitacion.urlExterna}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      Ver en Mercado Público
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Fechas Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Publicación</p>
                  <p className="text-base text-white">
                    {licitacion.fechaPublicacion
                      ? new Date(licitacion.fechaPublicacion).toLocaleDateString('es-CL')
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Cierre</p>
                  <p className="text-base text-white">
                    {licitacion.fechaCierre
                      ? new Date(licitacion.fechaCierre).toLocaleDateString('es-CL')
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Días Restantes</p>
                  <p className={`text-xl font-bold ${getDaysColor(licitacion.diasRestantes)}`}>
                    {licitacion.diasRestantes !== undefined ? `${licitacion.diasRestantes} días` : "-"}
                  </p>
                </div>
                {licitacion.fechaAdjudicacion && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Adjudicación</p>
                    <p className="text-base text-white">
                      {new Date(licitacion.fechaAdjudicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notas y documentos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Notas */}
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquarePlus className="h-5 w-5" />
                  Notas y Eventos
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Registra notas y eventos relacionados con esta licitación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Escribe una nueva nota..."
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    className="min-h-[100px] border-white/20 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <Button
                    onClick={handleAgregarNota}
                    disabled={enviandoNota || !nuevaNota.trim()}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {enviandoNota ? "Guardando..." : "Agregar Nota"}
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {licitacion.notas && licitacion.notas.length > 0 ? (
                    licitacion.notas.map((nota: any) => (
                      <div key={nota.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-sm text-white">{nota.contenido}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span>{nota.autor?.name || "Usuario"}</span>
                          <span>{new Date(nota.createdAt).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                      <FileText className="mb-2 h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-400">
                        Aún no hay notas. Agrega la primera nota arriba.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Archivos relacionados con esta licitación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {licitacion.documentos && licitacion.documentos.length > 0 ? (
                  licitacion.documentos.map((doc: any) => (
                    <div key={doc.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-medium text-white">{doc.nombre}</p>
                      {doc.descripcion && (
                        <p className="text-xs text-slate-400">{doc.descripcion}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{doc.tipoArchivo}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                    <FileText className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      No hay documentos adjuntos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-400">Responsable</p>
                <p className="text-base text-white">
                  {licitacion.responsable?.name || "No asignado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Creado por</p>
                <p className="text-base text-white">
                  {licitacion.createdBy?.name || "Desconocido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Fecha de creación</p>
                <p className="text-base text-white">
                  {new Date(licitacion.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
