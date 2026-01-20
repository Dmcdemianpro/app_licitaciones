"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Trash2,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORES = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Amarillo" },
  { value: "#EF4444", label: "Rojo" },
  { value: "#8B5CF6", label: "Púrpura" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#F97316", label: "Naranja" },
];

export default function AdminGruposPage() {
  const [departamentoExpandido, setDepartamentoExpandido] = useState<string | null>(null);

  // Diálogos
  const [dialogDepartamento, setDialogDepartamento] = useState(false);
  const [dialogUnidad, setDialogUnidad] = useState(false);
  const [dialogUsuario, setDialogUsuario] = useState(false);
  const [dialogEliminar, setDialogEliminar] = useState<{ tipo: string; id: string; nombre: string } | null>(null);

  // Estados de formularios
  const [editandoDepto, setEditandoDepto] = useState<any>(null);
  const [editandoUnidad, setEditandoUnidad] = useState<any>(null);
  const [deptoParaUnidad, setDeptoParaUnidad] = useState<string>("");
  const [entidadParaUsuario, setEntidadParaUsuario] = useState<{ tipo: "departamento" | "unidad"; id: string } | null>(null);

  const [formDepto, setFormDepto] = useState({ nombre: "", descripcion: "", codigo: "", color: "#3B82F6" });
  const [formUnidad, setFormUnidad] = useState({ nombre: "", descripcion: "", codigo: "" });
  const [formUsuario, setFormUsuario] = useState({ email: "", rol: "MIEMBRO" });

  const [guardando, setGuardando] = useState(false);

  // Fetch data
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);
  const { data: deptosData, mutate: mutateDepartamentos } = useSWR(
    "/api/departamentos?incluirUnidades=true&soloActivos=false",
    fetcher
  );
  const { data: usersData } = useSWR("/api/usuarios", fetcher);

  const isAdmin = sessionData?.user?.role === "ADMIN";
  const departamentos = deptosData?.departamentos ?? [];
  const usuarios = usersData?.usuarios ?? [];

  // Handlers para Departamentos
  const handleAbrirDialogDepto = (depto?: any) => {
    if (depto) {
      setEditandoDepto(depto);
      setFormDepto({
        nombre: depto.nombre,
        descripcion: depto.descripcion || "",
        codigo: depto.codigo || "",
        color: depto.color || "#3B82F6",
      });
    } else {
      setEditandoDepto(null);
      setFormDepto({ nombre: "", descripcion: "", codigo: "", color: "#3B82F6" });
    }
    setDialogDepartamento(true);
  };

  const handleGuardarDepto = async () => {
    if (!formDepto.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setGuardando(true);
    try {
      const url = editandoDepto
        ? `/api/departamentos/${editandoDepto.id}`
        : "/api/departamentos";
      const method = editandoDepto ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDepto),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar departamento");
        return;
      }

      toast.success(editandoDepto ? "Departamento actualizado" : "Departamento creado");
      setDialogDepartamento(false);
      mutateDepartamentos();
    } catch (error) {
      toast.error("Error al guardar departamento");
    } finally {
      setGuardando(false);
    }
  };

  // Handlers para Unidades
  const handleAbrirDialogUnidad = (deptoId: string, unidad?: any) => {
    setDeptoParaUnidad(deptoId);
    if (unidad) {
      setEditandoUnidad(unidad);
      setFormUnidad({
        nombre: unidad.nombre,
        descripcion: unidad.descripcion || "",
        codigo: unidad.codigo || "",
      });
    } else {
      setEditandoUnidad(null);
      setFormUnidad({ nombre: "", descripcion: "", codigo: "" });
    }
    setDialogUnidad(true);
  };

  const handleGuardarUnidad = async () => {
    if (!formUnidad.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setGuardando(true);
    try {
      const url = editandoUnidad
        ? `/api/unidades/${editandoUnidad.id}`
        : `/api/departamentos/${deptoParaUnidad}/unidades`;
      const method = editandoUnidad ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formUnidad),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar unidad");
        return;
      }

      toast.success(editandoUnidad ? "Unidad actualizada" : "Unidad creada");
      setDialogUnidad(false);
      mutateDepartamentos();
    } catch (error) {
      toast.error("Error al guardar unidad");
    } finally {
      setGuardando(false);
    }
  };

  // Handlers para Usuarios
  const handleAbrirDialogUsuario = (tipo: "departamento" | "unidad", id: string) => {
    setEntidadParaUsuario({ tipo, id });
    setFormUsuario({ email: "", rol: "MIEMBRO" });
    setDialogUsuario(true);
  };

  const handleAgregarUsuario = async () => {
    if (!formUsuario.email) {
      toast.error("Selecciona un usuario");
      return;
    }

    if (!entidadParaUsuario) return;

    setGuardando(true);
    try {
      // Buscar el usuario por email
      const usuario = usuarios.find((u: any) => u.email === formUsuario.email);
      if (!usuario) {
        toast.error("Usuario no encontrado");
        return;
      }

      const url = entidadParaUsuario.tipo === "departamento"
        ? `/api/departamentos/${entidadParaUsuario.id}/usuarios`
        : `/api/unidades/${entidadParaUsuario.id}/usuarios`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: usuario.id, rol: formUsuario.rol }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al agregar usuario");
        return;
      }

      toast.success("Usuario agregado");
      setDialogUsuario(false);
      mutateDepartamentos();
    } catch (error) {
      toast.error("Error al agregar usuario");
    } finally {
      setGuardando(false);
    }
  };

  // Handler para Eliminar
  const handleEliminar = async () => {
    if (!dialogEliminar) return;

    setGuardando(true);
    try {
      const url = dialogEliminar.tipo === "departamento"
        ? `/api/departamentos/${dialogEliminar.id}`
        : `/api/unidades/${dialogEliminar.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al eliminar");
        return;
      }

      toast.success(data.message || "Eliminado correctamente");
      setDialogEliminar(null);
      mutateDepartamentos();
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setGuardando(false);
    }
  };

  const handleRemoverUsuario = async (tipo: "departamento" | "unidad", entidadId: string, userId: string) => {
    try {
      const url = tipo === "departamento"
        ? `/api/departamentos/${entidadId}/usuarios?userId=${userId}`
        : `/api/unidades/${entidadId}/usuarios?userId=${userId}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al remover usuario");
        return;
      }

      toast.success("Usuario removido");
      mutateDepartamentos();
    } catch (error) {
      toast.error("Error al remover usuario");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Administración</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Grupos</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Administración</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Departamentos y Unidades</h1>
          </div>
        </div>
        <Button onClick={() => handleAbrirDialogDepto()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Departamento
        </Button>
      </header>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {departamentos.length === 0 ? (
            <Card className="border-white/10 bg-white/80 dark:bg-white/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-500 mb-4">No hay departamentos creados</p>
                <Button onClick={() => handleAbrirDialogDepto()} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer departamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            departamentos.map((depto: any) => (
              <Collapsible
                key={depto.id}
                open={departamentoExpandido === depto.id}
                onOpenChange={(open) => setDepartamentoExpandido(open ? depto.id : null)}
              >
                <Card className="border-white/10 bg-white/80 dark:bg-white/5 shadow-lg">
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          {departamentoExpandido === depto.id ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: depto.color || "#3B82F6" }}
                          />
                          <div>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                              {depto.nombre}
                              {depto.codigo && (
                                <Badge variant="outline" className="text-xs">
                                  {depto.codigo}
                                </Badge>
                              )}
                              {!depto.activo && (
                                <Badge variant="destructive" className="text-xs">
                                  Inactivo
                                </Badge>
                              )}
                            </CardTitle>
                            {depto.descripcion && (
                              <CardDescription className="text-slate-500">
                                {depto.descripcion}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="h-4 w-4" />
                            {depto._count?.usuarios || 0}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Building2 className="h-4 w-4" />
                            {depto._count?.unidades || 0} unidades
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirDialogDepto(depto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => setDialogEliminar({ tipo: "departamento", id: depto.id, nombre: depto.nombre })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <Separator className="bg-slate-200 dark:bg-white/10" />

                      {/* Usuarios del departamento */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Usuarios del Departamento
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirDialogUsuario("departamento", depto.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Agregar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {depto.usuarios?.filter((u: any) => u.activo).map((membresia: any) => (
                            <Badge
                              key={membresia.id}
                              variant="secondary"
                              className="flex items-center gap-2 py-1 px-3"
                            >
                              <span>{membresia.user?.name || membresia.user?.email}</span>
                              <span className="text-xs opacity-70">({membresia.rol})</span>
                              <button
                                onClick={() => handleRemoverUsuario("departamento", depto.id, membresia.userId)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )) || (
                            <p className="text-sm text-slate-400">Sin usuarios asignados</p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-slate-200 dark:bg-white/10" />

                      {/* Unidades */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Unidades
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirDialogUnidad(depto.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Unidad
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {depto.unidades?.length > 0 ? (
                            depto.unidades.map((unidad: any) => (
                              <div
                                key={unidad.id}
                                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                      {unidad.nombre}
                                      {unidad.codigo && (
                                        <Badge variant="outline" className="text-xs">
                                          {unidad.codigo}
                                        </Badge>
                                      )}
                                      {!unidad.activo && (
                                        <Badge variant="destructive" className="text-xs">
                                          Inactivo
                                        </Badge>
                                      )}
                                    </p>
                                    {unidad.descripcion && (
                                      <p className="text-sm text-slate-500">{unidad.descripcion}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                      <Users className="h-3 w-3" />
                                      {unidad._count?.usuarios || 0} usuarios
                                      <span className="mx-1">•</span>
                                      {unidad._count?.licitaciones || 0} licitaciones
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAbrirDialogUsuario("unidad", unidad.id)}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAbrirDialogUnidad(depto.id, unidad)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => setDialogEliminar({ tipo: "unidad", id: unidad.id, nombre: unidad.nombre })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 py-4 text-center">
                              No hay unidades en este departamento
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </div>

      {/* Dialog Departamento */}
      <Dialog open={dialogDepartamento} onOpenChange={setDialogDepartamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoDepto ? "Editar Departamento" : "Nuevo Departamento"}
            </DialogTitle>
            <DialogDescription>
              Los departamentos agrupan unidades y usuarios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={formDepto.nombre}
                onChange={(e) => setFormDepto({ ...formDepto, nombre: e.target.value })}
                placeholder="Ej: HIS, Infraestructura"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código (opcional)</label>
              <Input
                value={formDepto.codigo}
                onChange={(e) => setFormDepto({ ...formDepto, codigo: e.target.value })}
                placeholder="Ej: HIS, INF"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formDepto.descripcion}
                onChange={(e) => setFormDepto({ ...formDepto, descripcion: e.target.value })}
                placeholder="Descripción del departamento"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {COLORES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFormDepto({ ...formDepto, color: c.value })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formDepto.color === c.value
                        ? "border-slate-900 dark:border-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDepartamento(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarDepto} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editandoDepto ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Unidad */}
      <Dialog open={dialogUnidad} onOpenChange={setDialogUnidad}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoUnidad ? "Editar Unidad" : "Nueva Unidad"}
            </DialogTitle>
            <DialogDescription>
              Las unidades pertenecen a un departamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={formUnidad.nombre}
                onChange={(e) => setFormUnidad({ ...formUnidad, nombre: e.target.value })}
                placeholder="Ej: Interoperabilidad, Soporte"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código (opcional)</label>
              <Input
                value={formUnidad.codigo}
                onChange={(e) => setFormUnidad({ ...formUnidad, codigo: e.target.value })}
                placeholder="Ej: INT, SOP"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formUnidad.descripcion}
                onChange={(e) => setFormUnidad({ ...formUnidad, descripcion: e.target.value })}
                placeholder="Descripción de la unidad"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogUnidad(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarUnidad} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editandoUnidad ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Agregar Usuario */}
      <Dialog open={dialogUsuario} onOpenChange={setDialogUsuario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Usuario</DialogTitle>
            <DialogDescription>
              Selecciona un usuario y su rol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Usuario *</label>
              <select
                value={formUsuario.email}
                onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2"
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map((u: any) => (
                  <option key={u.id} value={u.email}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Rol</label>
              <select
                value={formUsuario.rol}
                onChange={(e) => setFormUsuario({ ...formUsuario, rol: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2"
              >
                <option value="MIEMBRO">Miembro</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogUsuario(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarUsuario} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={!!dialogEliminar} onOpenChange={() => setDialogEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {dialogEliminar?.tipo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar "{dialogEliminar?.nombre}". Si tiene licitaciones asociadas, será desactivado en lugar de eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={guardando}
              className="bg-red-600 hover:bg-red-700"
            >
              {guardando ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
