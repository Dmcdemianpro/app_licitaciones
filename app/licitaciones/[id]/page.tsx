"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, FileText, MessageSquarePlus, Send, Upload, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCLP, formatFolio } from "@/lib/formatters";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LicitacionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nuevaNota, setNuevaNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [descripcionDoc, setDescripcionDoc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [motivoEliminacion, setMotivoEliminacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [editandoUnidad, setEditandoUnidad] = useState(false);
  const [unidadTemp, setUnidadTemp] = useState("");

  const { data, error, isLoading, mutate } = useSWR(
    `/api/licitaciones/${id}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener la licitación");
      return res.json();
    }
  );

  const licitacion = data?.licitacion;

  // Fetch session to check permissions
  const { data: sessionData } = useSWR('/api/auth/session', fetcher);
  const isAdmin = sessionData?.user?.role === 'ADMIN';

  // Fetch documents separately for real-time updates
  const { data: docsData, mutate: mutateDocs } = useSWR(
    `/api/licitaciones/${id}/documentos`,
    fetcher
  );

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

  const handleSubirDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("El archivo es demasiado grande (máximo 10MB)");
      return;
    }

    setSubiendoDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("descripcion", descripcionDoc);

      const res = await fetch(`/api/licitaciones/${id}/documentos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al subir documento");
        return;
      }

      toast.success("Documento subido correctamente");
      setDescripcionDoc("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      mutateDocs(); // Recargar documentos
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al subir documento");
    } finally {
      setSubiendoDoc(false);
    }
  };

  const handleEliminarDocumento = async (documentoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) {
      return;
    }

    try {
      const res = await fetch(`/api/licitaciones/${id}/documentos?documentoId=${documentoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar documento");
        return;
      }

      toast.success("Documento eliminado");
      mutateDocs(); // Recargar documentos
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar documento");
    }
  };

  const handleGuardarUnidad = async () => {
    try {
      const res = await fetch(`/api/licitaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unidadResponsable: unidadTemp }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al actualizar unidad responsable");
        return;
      }

      toast.success("Unidad responsable actualizada");
      setEditandoUnidad(false);
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar unidad responsable");
    }
  };

  const handleEliminar = async () => {
    if (motivoEliminacion.trim().length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres");
      return;
    }

    setEliminando(true);
    try {
      const res = await fetch(
        `/api/licitaciones/${id}?motivo=${encodeURIComponent(motivoEliminacion)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al eliminar licitación");
        return;
      }

      toast.success("Licitación eliminada correctamente");
      router.push("/licitaciones");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar licitación");
    } finally {
      setEliminando(false);
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
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Licitación</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cargando...</h1>
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
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Licitación</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Error</h1>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-red-300">No se pudo cargar la licitación</p>
          <Button variant="default" onClick={() => router.push("/licitaciones")} className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Licitaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Licitación</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {licitacion.folioFormateado || formatFolio(licitacion.folio)}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {licitacion.codigoExterno && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Código MP: {licitacion.codigoExterno} •{" "}
                </span>
              )}
              {licitacion.nombre}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!licitacion.deletedAt && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar licitación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción marcará la licitación como eliminada. Solo los administradores podrán verla y restaurarla.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Motivo de eliminación (obligatorio, mínimo 10 caracteres)
                  </label>
                  <Textarea
                    placeholder="Ej: Licitación duplicada, se debe usar HEC-042"
                    value={motivoEliminacion}
                    onChange={(e) => setMotivoEliminacion(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEliminar}
                    disabled={eliminando || motivoEliminacion.trim().length < 10}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {eliminando ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="default" asChild className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
            <Link href="/licitaciones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Información general */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Nombre</p>
                  <p className="text-base text-slate-900 dark:text-white">{licitacion.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Descripción</p>
                  <p className="text-base text-slate-600 dark:text-slate-300">{licitacion.descripcion || "Sin descripción"}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Entidad</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.entidad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Tipo</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.tipo}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Estado</p>
                    <Badge variant={getStatusColor(licitacion.estado)} className="mt-1 text-slate-900 dark:text-white">
                      {licitacion.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Monto Estimado</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {formatCLP(licitacion.montoEstimado)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Unidad Responsable</p>
                  {editandoUnidad ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={unidadTemp}
                        onChange={(e) => setUnidadTemp(e.target.value)}
                        placeholder="Ej: Dpto. Adquisiciones"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleGuardarUnidad} className="bg-green-600 hover:bg-green-700">
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditandoUnidad(false);
                          setUnidadTemp("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-base text-slate-900 dark:text-white">
                        {licitacion.unidadResponsable || "No asignada"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditandoUnidad(true);
                          setUnidadTemp(licitacion.unidadResponsable || "");
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  )}
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

            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Fechas Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Publicación</p>
                  <p className="text-base text-slate-900 dark:text-white">
                    {licitacion.fechaPublicacion
                      ? new Date(licitacion.fechaPublicacion).toLocaleDateString('es-CL')
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Cierre</p>
                  <p className="text-base text-slate-900 dark:text-white">
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
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaAdjudicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información del Comprador y Ubicación */}
          {(licitacion.regionUnidad || licitacion.comunaUnidad || licitacion.nombreUnidad || licitacion.nombreUsuario) && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Información del Comprador</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {licitacion.regionUnidad && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Región</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.regionUnidad}</p>
                  </div>
                )}
                {licitacion.comunaUnidad && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Comuna</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.comunaUnidad}</p>
                  </div>
                )}
                {licitacion.nombreUnidad && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Unidad Compradora</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.nombreUnidad}</p>
                  </div>
                )}
                {licitacion.direccionUnidad && (
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-slate-400">Dirección</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.direccionUnidad}</p>
                  </div>
                )}
                {licitacion.nombreUsuario && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Responsable del Organismo</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.nombreUsuario}</p>
                  </div>
                )}
                {licitacion.cargoUsuario && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Cargo</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.cargoUsuario}</p>
                  </div>
                )}
                {licitacion.codigoOrganismo && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Código Organismo</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.codigoOrganismo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información Contractual y Financiera */}
          {(licitacion.fuenteFinanciamiento || licitacion.tiempoDuracionContrato || licitacion.nombreResponsableContrato || licitacion.cantidadReclamos !== null) && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Información Contractual y Financiera</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {licitacion.fuenteFinanciamiento && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Fuente de Financiamiento</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.fuenteFinanciamiento}</p>
                  </div>
                )}
                {licitacion.tiempoDuracionContrato && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Duración del Contrato</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.tiempoDuracionContrato} meses</p>
                  </div>
                )}
                {licitacion.esRenovable !== null && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Renovable</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.esRenovable ? "Sí" : "No"}</p>
                  </div>
                )}
                {licitacion.nombreResponsableContrato && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Responsable del Contrato</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.nombreResponsableContrato}</p>
                  </div>
                )}
                {licitacion.emailResponsableContrato && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Email Responsable</p>
                    <a href={`mailto:${licitacion.emailResponsableContrato}`} className="text-base text-indigo-400 hover:text-indigo-300">
                      {licitacion.emailResponsableContrato}
                    </a>
                  </div>
                )}
                {licitacion.fonoResponsableContrato && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Teléfono Responsable</p>
                    <a href={`tel:${licitacion.fonoResponsableContrato}`} className="text-base text-indigo-400 hover:text-indigo-300">
                      {licitacion.fonoResponsableContrato}
                    </a>
                  </div>
                )}
                {licitacion.cantidadReclamos !== null && licitacion.cantidadReclamos > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Cantidad de Reclamos</p>
                    <p className="text-base text-red-400 font-bold">{licitacion.cantidadReclamos}</p>
                  </div>
                )}
                {licitacion.codigoBIP && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Código BIP</p>
                    <p className="text-base text-slate-900 dark:text-white">{licitacion.codigoBIP}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items de la Licitación */}
          {licitacion.items && licitacion.items.length > 0 && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Productos/Servicios Solicitados</CardTitle>
                <CardDescription className="text-slate-300">
                  {licitacion.items.length} {licitacion.items.length === 1 ? 'item' : 'items'} en esta licitación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {licitacion.items.map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Item {item.correlativo}
                            </Badge>
                            {item.categoria && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">{item.categoria}</span>
                            )}
                          </div>
                          {item.nombreProducto && (
                            <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                              {item.nombreProducto}
                            </p>
                          )}
                          {item.descripcion && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {item.descripcion}
                            </p>
                          )}
                          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                            {item.cantidad && item.unidadMedida && (
                              <span>Cantidad: {item.cantidad} {item.unidadMedida}</span>
                            )}
                            {item.codigoProducto && (
                              <span>Código: {item.codigoProducto}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de Adjudicación */}
          {licitacion.adjudicacion && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Información de Adjudicación</CardTitle>
                <CardDescription className="text-slate-300">
                  Datos del proveedor ganador y detalles de la adjudicación
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {licitacion.adjudicacion.proveedorNombre && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-400">Proveedor Adjudicado</p>
                    <p className="text-base font-semibold text-emerald-400">
                      {licitacion.adjudicacion.proveedorNombre}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.proveedorRut && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">RUT Proveedor</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {licitacion.adjudicacion.proveedorRut}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.montoAdjudicado && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Monto Adjudicado</p>
                    <p className="text-base font-bold text-emerald-400">
                      {formatCLP(licitacion.adjudicacion.montoAdjudicado)}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.fechaAdjudicacion && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Fecha de Adjudicación</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.adjudicacion.fechaAdjudicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.cantidadOferentes !== null && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Cantidad de Oferentes</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {licitacion.adjudicacion.cantidadOferentes}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.numeroAdjudicacion && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Número de Adjudicación</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {licitacion.adjudicacion.numeroAdjudicacion}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.tipoAdjudicacion !== null && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Tipo de Adjudicación</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      Tipo {licitacion.adjudicacion.tipoAdjudicacion}
                    </p>
                  </div>
                )}
                {licitacion.adjudicacion.estadoAdjudicacion && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Estado</p>
                    <Badge variant="outline" className="mt-1">
                      {licitacion.adjudicacion.estadoAdjudicacion}
                    </Badge>
                  </div>
                )}
                {licitacion.adjudicacion.observaciones && (
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-slate-400">Observaciones</p>
                    <p className="text-base text-slate-600 dark:text-slate-300">
                      {licitacion.adjudicacion.observaciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fechas Adicionales */}
          {(licitacion.fechaEstimadaAdjudicacion || licitacion.fechaActoAperturaTecnica || licitacion.fechaActoAperturaEconomica || licitacion.fechaVisitaTerreno) && (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Fechas Adicionales del Proceso</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {licitacion.fechaEstimadaAdjudicacion && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Adjudicación Estimada</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaEstimadaAdjudicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.fechaActoAperturaTecnica && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Apertura Técnica</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaActoAperturaTecnica).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.fechaActoAperturaEconomica && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Apertura Económica</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaActoAperturaEconomica).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.fechaVisitaTerreno && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Visita a Terreno</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaVisitaTerreno).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.fechaPubRespuestas && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Publicación de Respuestas</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaPubRespuestas).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                {licitacion.fechaEstimadaFirma && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Firma Estimada</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.fechaEstimadaFirma).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notas y documentos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Notas */}
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
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
                    className="min-h-[100px] border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <Button
                    onClick={handleAgregarNota}
                    disabled={enviandoNota || !nuevaNota.trim()}
                    className="w-full bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {enviandoNota ? "Guardando..." : "Agregar Nota"}
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {licitacion.notas && licitacion.notas.length > 0 ? (
                    licitacion.notas.map((nota: any) => (
                      <div key={nota.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-3">
                        <p className="text-sm text-slate-900 dark:text-white">{nota.contenido}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span>{nota.autor?.name || "Usuario"}</span>
                          <span>{new Date(nota.createdAt).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
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
            <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <FileText className="h-5 w-5" />
                  Documentos PDF
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Sube archivos PDF relacionados con esta licitación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Section */}
                <div className="space-y-2">
                  <Input
                    placeholder="Descripción del documento (opcional)"
                    value={descripcionDoc}
                    onChange={(e) => setDescripcionDoc(e.target.value)}
                    className="border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleSubirDocumento}
                      disabled={subiendoDoc}
                      className="border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white file:mr-2 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-sm file:text-white hover:file:bg-indigo-700"
                    />
                  </div>
                  {subiendoDoc && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">Subiendo documento...</p>
                  )}
                </div>

                <Separator className="bg-slate-200 dark:bg-white/10" />

                {/* Documents List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {docsData?.documentos && docsData.documentos.length > 0 ? (
                    docsData.documentos.map((doc: any) => (
                      <div key={doc.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.nombre}</p>
                            {doc.descripcion && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">{doc.descripcion}</p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>{(doc.tamano / 1024 / 1024).toFixed(2)} MB</span>
                              <span>{new Date(doc.createdAt).toLocaleDateString('es-CL')}</span>
                              <span>{doc.uploadedBy?.name || "Usuario"}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                            >
                              <a href={doc.rutaArchivo} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEliminarDocumento(doc.id)}
                                className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 px-6 py-8 text-center">
                      <FileText className="mb-2 h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No hay documentos adjuntos. Sube el primer PDF arriba.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-400">Responsable</p>
                <p className="text-base text-slate-900 dark:text-white">
                  {licitacion.responsable?.name || "No asignado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Creado por</p>
                <p className="text-base text-slate-900 dark:text-white">
                  {licitacion.createdBy?.name || "Desconocido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Fecha de creación</p>
                <p className="text-base text-slate-900 dark:text-white">
                  {new Date(licitacion.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
              {licitacion.deletedAt && (
                <>
                  <div className="md:col-span-3">
                    <Separator className="mb-4" />
                    <p className="text-sm font-bold text-red-500 mb-2">LICITACIÓN ELIMINADA</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Eliminada por</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {licitacion.deletedBy?.name || "Desconocido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Fecha de eliminación</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {new Date(licitacion.deletedAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-slate-400">Motivo de eliminación</p>
                    <p className="text-base text-slate-900 dark:text-white">
                      {licitacion.motivoEliminacion}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
