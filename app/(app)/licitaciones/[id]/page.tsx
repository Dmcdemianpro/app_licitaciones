"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, FileText, MessageSquarePlus, Send, Upload, Download, Trash2, Headphones, Plus, Edit, X, Eye, EyeOff, ChevronDown, ChevronRight, Building2, DollarSign, MapPin, Users, Clock, Package, Award } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCLP, formatFolio } from "@/lib/formatters";
import { EventosTimeline } from "@/components/licitaciones/EventosTimeline";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Componente para secciones colapsables compactas
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-indigo-500" />
          <span className="font-medium text-slate-900 dark:text-white">{title}</span>
          {badge !== undefined && (
            <Badge variant="secondary" className="ml-2">{badge}</Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

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
  const [departamentoId, setDepartamentoId] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [guardandoGrupo, setGuardandoGrupo] = useState(false);

  // Estados para Soporte Técnico
  const [mostrandoFormSoporte, setMostrandoFormSoporte] = useState(false);
  const [guardandoSoporte, setGuardandoSoporte] = useState(false);
  const [editandoSoporteId, setEditandoSoporteId] = useState<string | null>(null);
  const [formSoporte, setFormSoporte] = useState({
    nombreContacto: "",
    emailContacto: "",
    telefonoContacto: "",
    tipoSoporte: "TECNICO",
    horarioInicio: "",
    horarioFin: "",
    diasDisponibles: "",
    observaciones: "",
  });

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
  const canManageGroup = ["ADMIN", "SUPERVISOR"].includes(sessionData?.user?.role ?? "");

  // Fetch documents separately for real-time updates
  const { data: docsData, mutate: mutateDocs } = useSWR(
    `/api/licitaciones/${id}/documentos`,
    fetcher
  );

  const { data: departamentosData } = useSWR(
    "/api/departamentos?incluirUnidades=true&soloActivos=true",
    fetcher
  );

  const departamentos = departamentosData?.departamentos ?? [];
  const unidadesDisponibles = useMemo(() => {
    if (!departamentoId) {
      return departamentos.flatMap((dep: any) => dep.unidades ?? []);
    }

    const departamentoSeleccionado = departamentos.find((dep: any) => dep.id === departamentoId);
    return departamentoSeleccionado?.unidades ?? [];
  }, [departamentos, departamentoId]);

  useEffect(() => {
    if (!licitacion) {
      return;
    }

    setDepartamentoId(licitacion.departamentoId ?? "");
    setUnidadId(licitacion.unidadId ?? "");
  }, [licitacion?.departamentoId, licitacion?.unidadId]);

  const grupoChanged =
    (licitacion?.departamentoId ?? "") !== departamentoId ||
    (licitacion?.unidadId ?? "") !== unidadId;

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
      mutate();
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

    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
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
      mutateDocs();
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
      mutateDocs();
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

  const handleDepartamentoChange = (value: string) => {
    const nuevoDepartamento = value === "none" ? "" : value;
    setDepartamentoId(nuevoDepartamento);

    if (!nuevoDepartamento) {
      setUnidadId("");
      return;
    }

    const departamentoSeleccionado = departamentos.find((dep: any) => dep.id === nuevoDepartamento);
    const unidades = departamentoSeleccionado?.unidades ?? [];
    if (unidadId && !unidades.some((unidad: any) => unidad.id === unidadId)) {
      setUnidadId("");
    }
  };

  const handleGuardarGrupo = async () => {
    setGuardandoGrupo(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departamentoId: departamentoId || null,
          unidadId: unidadId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al actualizar grupo");
        return;
      }

      toast.success("Grupo actualizado");
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar grupo");
    } finally {
      setGuardandoGrupo(false);
    }
  };

  const handleGuardarSoporte = async () => {
    if (!formSoporte.nombreContacto.trim() || !formSoporte.emailContacto.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    setGuardandoSoporte(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}/soporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSoporte),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al guardar contacto");
        return;
      }

      toast.success("Contacto de soporte agregado");
      setFormSoporte({
        nombreContacto: "",
        emailContacto: "",
        telefonoContacto: "",
        tipoSoporte: "TECNICO",
        horarioInicio: "",
        horarioFin: "",
        diasDisponibles: "",
        observaciones: "",
      });
      setMostrandoFormSoporte(false);
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar contacto");
    } finally {
      setGuardandoSoporte(false);
    }
  };

  const handleEditarSoporte = (soporte: any) => {
    setEditandoSoporteId(soporte.id);
    setFormSoporte({
      nombreContacto: soporte.nombreContacto,
      emailContacto: soporte.emailContacto,
      telefonoContacto: soporte.telefonoContacto || "",
      tipoSoporte: soporte.tipoSoporte,
      horarioInicio: soporte.horarioInicio || "",
      horarioFin: soporte.horarioFin || "",
      diasDisponibles: soporte.diasDisponibles || "",
      observaciones: soporte.observaciones || "",
    });
    setMostrandoFormSoporte(true);
  };

  const handleActualizarSoporte = async () => {
    if (!formSoporte.nombreContacto.trim() || !formSoporte.emailContacto.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    setGuardandoSoporte(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}/soporte/${editandoSoporteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSoporte),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al actualizar contacto");
        return;
      }

      toast.success("Contacto de soporte actualizado");
      setFormSoporte({
        nombreContacto: "",
        emailContacto: "",
        telefonoContacto: "",
        tipoSoporte: "TECNICO",
        horarioInicio: "",
        horarioFin: "",
        diasDisponibles: "",
        observaciones: "",
      });
      setEditandoSoporteId(null);
      setMostrandoFormSoporte(false);
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar contacto");
    } finally {
      setGuardandoSoporte(false);
    }
  };

  const handleEliminarSoporte = async (soporteId: string) => {
    if (!confirm("¿Estás seguro de eliminar este contacto de soporte?")) {
      return;
    }

    try {
      const res = await fetch(`/api/licitaciones/${id}/soporte/${soporteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar contacto");
        return;
      }

      toast.success("Contacto de soporte eliminado");
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar contacto");
    }
  };

  const handleCancelarEdicion = () => {
    setFormSoporte({
      nombreContacto: "",
      emailContacto: "",
      telefonoContacto: "",
      tipoSoporte: "TECNICO",
      horarioInicio: "",
      horarioFin: "",
      diasDisponibles: "",
      observaciones: "",
    });
    setEditandoSoporteId(null);
    setMostrandoFormSoporte(false);
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
    if (days === undefined) return "text-slate-400";
    if (days <= 3) return "text-red-500";
    if (days <= 7) return "text-orange-500";
    return "text-emerald-500";
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
          <p className="text-slate-400">Cargando detalles de la licitación...</p>
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
          <p className="text-red-400">No se pudo cargar la licitación</p>
          <Button variant="default" onClick={() => router.push("/licitaciones")} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Licitaciones
          </Button>
        </div>
      </div>
    );
  }

  // Datos para el resumen compacto
  const hasCompradorInfo = licitacion.regionUnidad || licitacion.comunaUnidad || licitacion.nombreUnidad || licitacion.nombreUsuario;
  const hasContractualInfo = licitacion.fuenteFinanciamiento || licitacion.tiempoDuracionContrato || licitacion.nombreResponsableContrato || licitacion.cantidadReclamos !== null;
  const hasItems = licitacion.items && licitacion.items.length > 0;
  const hasAdjudicacion = licitacion.adjudicacion;
  const hasFechasAdicionales = licitacion.fechaEstimadaAdjudicacion || licitacion.fechaActoAperturaTecnica || licitacion.fechaActoAperturaEconomica || licitacion.fechaVisitaTerreno || licitacion.fechaCreacion || licitacion.fechaInicio || licitacion.fechaFinal;
  const hasDirecciones = licitacion.direccionVisita || licitacion.direccionEntrega;
  const hasEtapas = licitacion.etapas || licitacion.estadoEtapas || licitacion.tomaRazon || licitacion.estadoPublicidadOfertas || licitacion.contrato || licitacion.obras;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      {/* Header compacto */}
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {licitacion.folioFormateado || formatFolio(licitacion.folio)}
                  </h1>
                  <Badge variant={getStatusColor(licitacion.estado)}>{licitacion.estado}</Badge>
                  {licitacion.deletedAt && <Badge variant="destructive">ELIMINADA</Badge>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl truncate">
                  {licitacion.codigoExterno && <span className="text-slate-500">MP: {licitacion.codigoExterno} • </span>}
                  {licitacion.nombre}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!licitacion.deletedAt && isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar licitación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción marcará la licitación como eliminada. Solo los administradores podrán verla.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Motivo (mínimo 10 caracteres)</label>
                      <Textarea
                        placeholder="Ej: Licitación duplicada..."
                        value={motivoEliminacion}
                        onChange={(e) => setMotivoEliminacion(e.target.value)}
                        className="min-h-[80px]"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/licitaciones/${id}/export-pdf`, "_blank")}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="default" size="sm" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Link href="/licitaciones">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Link>
              </Button>
            </div>
          </div>

          {/* Resumen rápido - siempre visible */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Monto Estimado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCLP(licitacion.montoEstimado)}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Días Restantes</p>
              <p className={`text-lg font-bold ${getDaysColor(licitacion.diasRestantes)}`}>
                {licitacion.diasRestantes !== undefined ? `${licitacion.diasRestantes} días` : "-"}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Cierre</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {licitacion.fechaCierre ? new Date(licitacion.fechaCierre).toLocaleDateString('es-CL') : "-"}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Entidad</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{licitacion.entidad}</p>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Tipo</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{licitacion.tipo}</p>
            </div>
            {licitacion.urlExterna && (
              <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Enlace</p>
                <a
                  href={licitacion.urlExterna}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Mercado Público <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal con tabs */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documentos">Docs y Notas</TabsTrigger>
              <TabsTrigger value="soporte">Soporte</TabsTrigger>
            </TabsList>

            {/* Tab General */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Información General */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nombre</p>
                      <p className="text-sm text-slate-900 dark:text-white">{licitacion.nombre}</p>
                    </div>
                    {licitacion.descripcion && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Descripción</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{licitacion.descripcion}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Publicación</p>
                        <p className="text-sm text-slate-900 dark:text-white">
                          {licitacion.fechaPublicacion ? new Date(licitacion.fechaPublicacion).toLocaleDateString('es-CL') : "-"}
                        </p>
                      </div>
                      {licitacion.fechaAdjudicacion && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Adjudicación</p>
                          <p className="text-sm text-slate-900 dark:text-white">
                            {new Date(licitacion.fechaAdjudicacion).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      )}
                    </div>
                    {(licitacion.codigoEstado || licitacion.estadoTexto || licitacion.codigoTipo || licitacion.tipoLicitacion) && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                        {licitacion.codigoEstado && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Código Estado</p>
                            <p className="text-sm text-slate-900 dark:text-white">{licitacion.codigoEstado}</p>
                          </div>
                        )}
                        {licitacion.tipoLicitacion && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tipo Licitación</p>
                            <p className="text-sm text-slate-900 dark:text-white">{licitacion.tipoLicitacion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grupo y Responsable */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-500" />
                      Asignación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Unidad Responsable</p>
                      {editandoUnidad ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={unidadTemp}
                            onChange={(e) => setUnidadTemp(e.target.value)}
                            placeholder="Ej: Dpto. Adquisiciones"
                            className="flex-1 h-8 text-sm"
                          />
                          <Button size="sm" onClick={handleGuardarUnidad} className="h-8 bg-green-600 hover:bg-green-700">
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditandoUnidad(false); setUnidadTemp(""); }} className="h-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-900 dark:text-white">{licitacion.unidadResponsable || "No asignada"}</p>
                          <Button size="sm" variant="ghost" onClick={() => { setEditandoUnidad(true); setUnidadTemp(licitacion.unidadResponsable || ""); }} className="h-6 px-2 text-xs">
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grupo</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Departamento</p>
                          <Select value={departamentoId || "none"} onValueChange={handleDepartamentoChange} disabled={!canManageGroup}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin departamento</SelectItem>
                              {departamentos.map((dep: any) => (
                                <SelectItem key={dep.id} value={dep.id}>{dep.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Unidad</p>
                          <Select value={unidadId || "none"} onValueChange={(value) => setUnidadId(value === "none" ? "" : value)} disabled={!canManageGroup}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin unidad</SelectItem>
                              {unidadesDisponibles.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {canManageGroup && grupoChanged && (
                        <Button size="sm" onClick={handleGuardarGrupo} disabled={guardandoGrupo} className="w-full h-8 bg-indigo-600 hover:bg-indigo-700">
                          {guardandoGrupo ? "Guardando..." : "Guardar grupo"}
                        </Button>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Responsable</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.responsable?.name || "No asignado"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Creado por</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.createdBy?.name || "Desconocido"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Adjudicación si existe */}
              {hasAdjudicacion && (
                <Card className="border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <Award className="h-5 w-5" />
                      Adjudicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {licitacion.adjudicacion.proveedorNombre && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Proveedor</p>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{licitacion.adjudicacion.proveedorNombre}</p>
                        </div>
                      )}
                      {licitacion.adjudicacion.proveedorRut && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">RUT</p>
                          <p className="text-sm text-slate-900 dark:text-white">{licitacion.adjudicacion.proveedorRut}</p>
                        </div>
                      )}
                      {licitacion.adjudicacion.montoAdjudicado && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Monto</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCLP(licitacion.adjudicacion.montoAdjudicado)}</p>
                        </div>
                      )}
                      {licitacion.adjudicacion.fechaAdjudicacion && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                          <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.adjudicacion.fechaAdjudicacion).toLocaleDateString('es-CL')}</p>
                        </div>
                      )}
                      {licitacion.adjudicacion.cantidadOferentes !== null && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Oferentes</p>
                          <p className="text-sm text-slate-900 dark:text-white">{licitacion.adjudicacion.cantidadOferentes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items si existen */}
              {hasItems && (
                <CollapsibleSection title="Productos/Servicios" icon={Package} badge={licitacion.items.length}>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {licitacion.items.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-3 p-2 rounded bg-slate-50 dark:bg-white/5">
                        <Badge variant="outline" className="text-xs shrink-0">#{item.correlativo}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.nombreProducto || item.descripcion}</p>
                          {item.cantidad && item.unidadMedida && (
                            <p className="text-xs text-slate-500">{item.cantidad} {item.unidadMedida}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </TabsContent>

            {/* Tab Detalles */}
            <TabsContent value="detalles" className="space-y-4">
              {hasCompradorInfo && (
                <CollapsibleSection title="Información del Comprador" icon={Users} defaultOpen={true}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {licitacion.nombreUnidad && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Unidad Compradora</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.nombreUnidad}</p>
                      </div>
                    )}
                    {licitacion.codigoOrganismo && (
                      <div>
                        <p className="text-xs text-slate-500">Código Organismo</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.codigoOrganismo}</p>
                      </div>
                    )}
                    {licitacion.rutUnidad && (
                      <div>
                        <p className="text-xs text-slate-500">RUT Unidad</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.rutUnidad}</p>
                      </div>
                    )}
                    {licitacion.regionUnidad && (
                      <div>
                        <p className="text-xs text-slate-500">Región</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.regionUnidad}</p>
                      </div>
                    )}
                    {licitacion.comunaUnidad && (
                      <div>
                        <p className="text-xs text-slate-500">Comuna</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.comunaUnidad}</p>
                      </div>
                    )}
                    {licitacion.direccionUnidad && (
                      <div className="col-span-full">
                        <p className="text-xs text-slate-500">Dirección</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.direccionUnidad}</p>
                      </div>
                    )}
                    {licitacion.nombreUsuario && (
                      <>
                        <Separator className="col-span-full" />
                        <div>
                          <p className="text-xs text-slate-500">Responsable</p>
                          <p className="text-sm text-slate-900 dark:text-white">{licitacion.nombreUsuario}</p>
                        </div>
                        {licitacion.cargoUsuario && (
                          <div>
                            <p className="text-xs text-slate-500">Cargo</p>
                            <p className="text-sm text-slate-900 dark:text-white">{licitacion.cargoUsuario}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {hasContractualInfo && (
                <CollapsibleSection title="Información Contractual y Financiera" icon={DollarSign}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {licitacion.fuenteFinanciamiento && (
                      <div>
                        <p className="text-xs text-slate-500">Fuente Financiamiento</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.fuenteFinanciamiento}</p>
                      </div>
                    )}
                    {licitacion.modalidad && (
                      <div>
                        <p className="text-xs text-slate-500">Modalidad</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.modalidad}</p>
                      </div>
                    )}
                    {licitacion.tipoPago && (
                      <div>
                        <p className="text-xs text-slate-500">Tipo de Pago</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.tipoPago}</p>
                      </div>
                    )}
                    {(licitacion.tiempoDuracionContrato && licitacion.unidadTiempoDuracionContrato) && (
                      <div>
                        <p className="text-xs text-slate-500">Duración Contrato</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.tiempoDuracionContrato} {licitacion.unidadTiempoDuracionContrato}</p>
                      </div>
                    )}
                    {licitacion.esRenovable !== null && (
                      <div>
                        <p className="text-xs text-slate-500">Renovable</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.esRenovable ? "Sí" : "No"}</p>
                      </div>
                    )}
                    {licitacion.nombreResponsableContrato && (
                      <>
                        <Separator className="col-span-full" />
                        <div>
                          <p className="text-xs text-slate-500">Responsable Contrato</p>
                          <p className="text-sm text-slate-900 dark:text-white">{licitacion.nombreResponsableContrato}</p>
                        </div>
                        {licitacion.emailResponsableContrato && (
                          <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <a href={`mailto:${licitacion.emailResponsableContrato}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                              {licitacion.emailResponsableContrato}
                            </a>
                          </div>
                        )}
                        {licitacion.fonoResponsableContrato && (
                          <div>
                            <p className="text-xs text-slate-500">Teléfono</p>
                            <a href={`tel:${licitacion.fonoResponsableContrato}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                              {licitacion.fonoResponsableContrato}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                    {licitacion.cantidadReclamos !== null && licitacion.cantidadReclamos > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Reclamos</p>
                        <p className="text-sm font-bold text-red-500">{licitacion.cantidadReclamos}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {hasFechasAdicionales && (
                <CollapsibleSection title="Fechas del Proceso" icon={Calendar}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {licitacion.fechaCreacion && (
                      <div>
                        <p className="text-xs text-slate-500">Creación</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaCreacion).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaInicio && (
                      <div>
                        <p className="text-xs text-slate-500">Inicio</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaInicio).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaFinal && (
                      <div>
                        <p className="text-xs text-slate-500">Final</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaFinal).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaEstimadaAdjudicacion && (
                      <div>
                        <p className="text-xs text-slate-500">Adjudicación Est.</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaEstimadaAdjudicacion).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaActoAperturaTecnica && (
                      <div>
                        <p className="text-xs text-slate-500">Apertura Técnica</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaActoAperturaTecnica).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaActoAperturaEconomica && (
                      <div>
                        <p className="text-xs text-slate-500">Apertura Económica</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaActoAperturaEconomica).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaVisitaTerreno && (
                      <div>
                        <p className="text-xs text-slate-500">Visita Terreno</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaVisitaTerreno).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                    {licitacion.fechaPubRespuestas && (
                      <div>
                        <p className="text-xs text-slate-500">Pub. Respuestas</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.fechaPubRespuestas).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {hasDirecciones && (
                <CollapsibleSection title="Direcciones" icon={MapPin}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {licitacion.direccionVisita && (
                      <div>
                        <p className="text-xs text-slate-500">Dirección de Visita</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.direccionVisita}</p>
                      </div>
                    )}
                    {licitacion.direccionEntrega && (
                      <div>
                        <p className="text-xs text-slate-500">Dirección de Entrega</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.direccionEntrega}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {hasEtapas && (
                <CollapsibleSection title="Estado del Proceso y Etapas" icon={Clock}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {licitacion.etapas && (
                      <div className="col-span-full">
                        <p className="text-xs text-slate-500">Etapas</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.etapas}</p>
                      </div>
                    )}
                    {licitacion.estadoEtapas && (
                      <div className="col-span-full">
                        <p className="text-xs text-slate-500">Estado de Etapas</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.estadoEtapas}</p>
                      </div>
                    )}
                    {licitacion.tomaRazon && (
                      <div>
                        <p className="text-xs text-slate-500">Toma de Razón</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.tomaRazon}</p>
                      </div>
                    )}
                    {licitacion.estadoPublicidadOfertas && (
                      <div>
                        <p className="text-xs text-slate-500">Publicidad Ofertas</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.estadoPublicidadOfertas}</p>
                      </div>
                    )}
                    {licitacion.contrato && (
                      <div>
                        <p className="text-xs text-slate-500">Contrato</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.contrato}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Información del sistema */}
              {licitacion.deletedAt && (
                <Card className="border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-600 dark:text-red-400">Licitación Eliminada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Eliminada por</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.deletedBy?.name || "Desconocido"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Fecha</p>
                        <p className="text-sm text-slate-900 dark:text-white">{new Date(licitacion.deletedAt).toLocaleDateString('es-CL')}</p>
                      </div>
                      <div className="col-span-full">
                        <p className="text-xs text-slate-500">Motivo</p>
                        <p className="text-sm text-slate-900 dark:text-white">{licitacion.motivoEliminacion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Timeline */}
            <TabsContent value="timeline">
              <EventosTimeline licitacionId={id} onEventoCreado={() => mutate()} />
            </TabsContent>

            {/* Tab Documentos y Notas */}
            <TabsContent value="documentos" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Notas */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquarePlus className="h-5 w-5 text-indigo-500" />
                      Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Escribe una nota..."
                        value={nuevaNota}
                        onChange={(e) => setNuevaNota(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <Button onClick={handleAgregarNota} disabled={enviandoNota || !nuevaNota.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700" size="sm">
                        <Send className="mr-2 h-4 w-4" />
                        {enviandoNota ? "Guardando..." : "Agregar"}
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {licitacion.notas && licitacion.notas.length > 0 ? (
                        licitacion.notas.map((nota: any) => (
                          <div key={nota.id} className="rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2">
                            <p className="text-sm text-slate-900 dark:text-white">{nota.contenido}</p>
                            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                              <span>{nota.autor?.name || "Usuario"}</span>
                              <span>{new Date(nota.createdAt).toLocaleString('es-CL')}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-slate-400 py-4">Sin notas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Documentos PDF
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Input placeholder="Descripción (opcional)" value={descripcionDoc} onChange={(e) => setDescripcionDoc(e.target.value)} className="text-sm h-8" />
                      <Input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleSubirDocumento} disabled={subiendoDoc} className="text-sm" />
                      {subiendoDoc && <p className="text-xs text-indigo-600">Subiendo...</p>}
                    </div>
                    <Separator />
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {docsData?.documentos && docsData.documentos.length > 0 ? (
                        docsData.documentos.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.nombre}</p>
                              <p className="text-xs text-slate-500">{(doc.tamano / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString('es-CL')}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                                <a href={doc.rutaArchivo} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              {isAdmin && (
                                <Button size="sm" variant="ghost" onClick={() => handleEliminarDocumento(doc.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-slate-400 py-4">Sin documentos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Soporte */}
            <TabsContent value="soporte">
              <Card className="border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Headphones className="h-5 w-5 text-indigo-500" />
                      Contactos de Soporte
                    </CardTitle>
                    {!mostrandoFormSoporte && (
                      <Button size="sm" onClick={() => setMostrandoFormSoporte(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mostrandoFormSoporte && (
                    <div className="space-y-3 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs text-slate-500">Nombre *</label>
                          <Input value={formSoporte.nombreContacto} onChange={(e) => setFormSoporte({ ...formSoporte, nombreContacto: e.target.value })} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Email *</label>
                          <Input type="email" value={formSoporte.emailContacto} onChange={(e) => setFormSoporte({ ...formSoporte, emailContacto: e.target.value })} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Teléfono</label>
                          <Input value={formSoporte.telefonoContacto} onChange={(e) => setFormSoporte({ ...formSoporte, telefonoContacto: e.target.value })} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Tipo</label>
                          <select value={formSoporte.tipoSoporte} onChange={(e) => setFormSoporte({ ...formSoporte, tipoSoporte: e.target.value })} className="mt-1 w-full h-8 rounded-md border text-sm px-2">
                            <option value="TECNICO">Técnico</option>
                            <option value="COMERCIAL">Comercial</option>
                            <option value="ADMINISTRATIVO">Administrativo</option>
                            <option value="OTRO">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Horario Inicio</label>
                          <Input type="time" value={formSoporte.horarioInicio} onChange={(e) => setFormSoporte({ ...formSoporte, horarioInicio: e.target.value })} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Horario Fin</label>
                          <Input type="time" value={formSoporte.horarioFin} onChange={(e) => setFormSoporte({ ...formSoporte, horarioFin: e.target.value })} className="mt-1 h-8 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-slate-500">Días Disponibles</label>
                          <Input value={formSoporte.diasDisponibles} onChange={(e) => setFormSoporte({ ...formSoporte, diasDisponibles: e.target.value })} placeholder="Ej: Lunes a Viernes" className="mt-1 h-8 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-slate-500">Observaciones</label>
                          <Textarea value={formSoporte.observaciones} onChange={(e) => setFormSoporte({ ...formSoporte, observaciones: e.target.value })} className="mt-1 min-h-[60px] text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={editandoSoporteId ? handleActualizarSoporte : handleGuardarSoporte} disabled={guardandoSoporte} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          {guardandoSoporte ? "Guardando..." : editandoSoporteId ? "Actualizar" : "Guardar"}
                        </Button>
                        <Button onClick={handleCancelarEdicion} variant="outline" size="sm" className="flex-1">Cancelar</Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {licitacion.soporteTecnico && licitacion.soporteTecnico.length > 0 ? (
                      licitacion.soporteTecnico.map((soporte: any) => (
                        <div key={soporte.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{soporte.nombreContacto}</p>
                              <Badge variant="outline" className="text-xs">{soporte.tipoSoporte}</Badge>
                            </div>
                            <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                <a href={`mailto:${soporte.emailContacto}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{soporte.emailContacto}</a>
                              </p>
                              {soporte.telefonoContacto && (
                                <p>
                                  <span className="font-medium">Tel:</span>{" "}
                                  <a href={`tel:${soporte.telefonoContacto}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{soporte.telefonoContacto}</a>
                                </p>
                              )}
                              {soporte.horarioInicio && soporte.horarioFin && (
                                <p><span className="font-medium">Horario:</span> {soporte.horarioInicio} - {soporte.horarioFin}</p>
                              )}
                              {soporte.diasDisponibles && (
                                <p><span className="font-medium">Días:</span> {soporte.diasDisponibles}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditarSoporte(soporte)} className="h-7 w-7 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEliminarSoporte(soporte.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-slate-400 py-8">No hay contactos de soporte registrados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
