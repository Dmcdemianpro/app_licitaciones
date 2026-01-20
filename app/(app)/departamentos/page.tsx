"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Building2, Layers, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DepartamentosPage() {
  const [departamentoSeleccionadoId, setDepartamentoSeleccionadoId] = useState("");
  const [unidadSeleccionadaId, setUnidadSeleccionadaId] = useState("");

  const [nuevoDepartamento, setNuevoDepartamento] = useState({
    nombre: "",
    descripcion: "",
    codigo: "",
  });
  const [nuevaUnidad, setNuevaUnidad] = useState({
    nombre: "",
    descripcion: "",
    codigo: "",
  });
  const [nuevoMiembroDepartamento, setNuevoMiembroDepartamento] = useState({
    userId: "",
    rol: "MIEMBRO",
  });
  const [nuevoMiembroUnidad, setNuevoMiembroUnidad] = useState({
    userId: "",
    rol: "MIEMBRO",
  });

  const [creandoDepartamento, setCreandoDepartamento] = useState(false);
  const [creandoUnidad, setCreandoUnidad] = useState(false);
  const [agregandoDepto, setAgregandoDepto] = useState(false);
  const [agregandoUnidad, setAgregandoUnidad] = useState(false);

  const { data: sessionData } = useSWR("/api/auth/session", fetcher);
  const isAdmin = sessionData?.user?.role === "ADMIN";

  const { data: departamentosData, mutate: mutateDepartamentos } = useSWR(
    "/api/departamentos?incluirUnidades=false&soloActivos=true",
    fetcher
  );
  const departamentos = departamentosData?.departamentos ?? [];

  useEffect(() => {
    if (!departamentoSeleccionadoId && departamentos.length) {
      setDepartamentoSeleccionadoId(departamentos[0].id);
    }
  }, [departamentos, departamentoSeleccionadoId]);

  const { data: unidadesData, mutate: mutateUnidades } = useSWR(
    departamentoSeleccionadoId
      ? `/api/departamentos/${departamentoSeleccionadoId}/unidades?soloActivos=false`
      : null,
    fetcher
  );
  const unidades = unidadesData?.unidades ?? [];

  useEffect(() => {
    if (!unidadSeleccionadaId && unidades.length) {
      setUnidadSeleccionadaId(unidades[0].id);
      return;
    }

    if (unidadSeleccionadaId && !unidades.some((unidad: any) => unidad.id === unidadSeleccionadaId)) {
      setUnidadSeleccionadaId(unidades[0]?.id ?? "");
    }
  }, [unidades, unidadSeleccionadaId]);

  const { data: usuariosData } = useSWR("/api/usuarios", fetcher);
  const usuarios = usuariosData?.users ?? [];
  const usuariosActivos = useMemo(
    () => usuarios.filter((user: any) => user.activo),
    [usuarios]
  );

  const { data: departamentoUsuariosData, mutate: mutateDepartamentoUsuarios } = useSWR(
    departamentoSeleccionadoId
      ? `/api/departamentos/${departamentoSeleccionadoId}/usuarios`
      : null,
    fetcher
  );
  const departamentoUsuarios = (departamentoUsuariosData?.usuarios ?? []).filter(
    (miembro: any) => miembro.activo
  );

  const { data: unidadUsuariosData, mutate: mutateUnidadUsuarios } = useSWR(
    unidadSeleccionadaId ? `/api/unidades/${unidadSeleccionadaId}/usuarios` : null,
    fetcher
  );
  const unidadUsuarios = (unidadUsuariosData?.usuarios ?? []).filter(
    (miembro: any) => miembro.activo
  );

  const handleCrearDepartamento = async () => {
    if (!nuevoDepartamento.nombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    setCreandoDepartamento(true);
    try {
      const res = await fetch("/api/departamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoDepartamento),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear departamento");
        return;
      }

      toast.success("Departamento creado");
      setNuevoDepartamento({ nombre: "", descripcion: "", codigo: "" });
      mutateDepartamentos();
      setDepartamentoSeleccionadoId(data.departamento?.id ?? "");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear departamento");
    } finally {
      setCreandoDepartamento(false);
    }
  };

  const handleCrearUnidad = async () => {
    if (!departamentoSeleccionadoId) {
      toast.error("Selecciona un departamento");
      return;
    }

    if (!nuevaUnidad.nombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    setCreandoUnidad(true);
    try {
      const res = await fetch(`/api/departamentos/${departamentoSeleccionadoId}/unidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaUnidad),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear unidad");
        return;
      }

      toast.success("Unidad creada");
      setNuevaUnidad({ nombre: "", descripcion: "", codigo: "" });
      mutateUnidades();
      mutateDepartamentos();
      setUnidadSeleccionadaId(data.unidad?.id ?? "");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear unidad");
    } finally {
      setCreandoUnidad(false);
    }
  };

  const handleAgregarUsuarioDepartamento = async () => {
    if (!departamentoSeleccionadoId || !nuevoMiembroDepartamento.userId) {
      toast.error("Selecciona un usuario");
      return;
    }

    setAgregandoDepto(true);
    try {
      const res = await fetch(`/api/departamentos/${departamentoSeleccionadoId}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMiembroDepartamento),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al agregar usuario");
        return;
      }

      toast.success("Usuario agregado al departamento");
      setNuevoMiembroDepartamento({ userId: "", rol: "MIEMBRO" });
      mutateDepartamentoUsuarios();
      mutateDepartamentos();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar usuario");
    } finally {
      setAgregandoDepto(false);
    }
  };

  const handleAgregarUsuarioUnidad = async () => {
    if (!unidadSeleccionadaId || !nuevoMiembroUnidad.userId) {
      toast.error("Selecciona un usuario");
      return;
    }

    setAgregandoUnidad(true);
    try {
      const res = await fetch(`/api/unidades/${unidadSeleccionadaId}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMiembroUnidad),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al agregar usuario");
        return;
      }

      toast.success("Usuario agregado a la unidad");
      setNuevoMiembroUnidad({ userId: "", rol: "MIEMBRO" });
      mutateUnidadUsuarios();
      mutateUnidades();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar usuario");
    } finally {
      setAgregandoUnidad(false);
    }
  };

  const handleQuitarUsuarioDepartamento = async (userId: string) => {
    if (!departamentoSeleccionadoId) return;

    try {
      const res = await fetch(
        `/api/departamentos/${departamentoSeleccionadoId}/usuarios?userId=${userId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al quitar usuario");
        return;
      }

      toast.success("Usuario removido del departamento");
      mutateDepartamentoUsuarios();
      mutateDepartamentos();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al quitar usuario");
    }
  };

  const handleQuitarUsuarioUnidad = async (userId: string) => {
    if (!unidadSeleccionadaId) return;

    try {
      const res = await fetch(
        `/api/unidades/${unidadSeleccionadaId}/usuarios?userId=${userId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al quitar usuario");
        return;
      }

      toast.success("Usuario removido de la unidad");
      mutateUnidadUsuarios();
      mutateUnidades();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al quitar usuario");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Administracion</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Departamentos y unidades</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Organiza equipos y acceso a licitaciones por grupo
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto w-full space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
                  Departamentos
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Selecciona un departamento para ver unidades y miembros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {departamentos.length === 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No hay departamentos creados.
                    </p>
                  )}
                  {departamentos.map((dep: any) => (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => setDepartamentoSeleccionadoId(dep.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                        departamentoSeleccionadoId === dep.id
                          ? "border-indigo-500 bg-indigo-50/80 dark:bg-white/10"
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {dep.nombre}
                        </p>
                        {dep.codigo && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{dep.codigo}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Usuarios: {dep._count?.usuarios ?? 0}</Badge>
                        <Badge variant="outline">Unidades: {dep._count?.unidades ?? 0}</Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {isAdmin && (
                  <>
                    <Separator className="bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Nuevo departamento
                      </p>
                      <Input
                        placeholder="Nombre"
                        value={nuevoDepartamento.nombre}
                        onChange={(e) =>
                          setNuevoDepartamento((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Input
                        placeholder="Codigo (opcional)"
                        value={nuevoDepartamento.codigo}
                        onChange={(e) =>
                          setNuevoDepartamento((prev) => ({ ...prev, codigo: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Textarea
                        placeholder="Descripcion (opcional)"
                        value={nuevoDepartamento.descripcion}
                        onChange={(e) =>
                          setNuevoDepartamento((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Button
                        onClick={handleCrearDepartamento}
                        disabled={creandoDepartamento}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {creandoDepartamento ? "Creando..." : "Crear departamento"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
                  Unidades
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Unidades dentro del departamento seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!departamentoSeleccionadoId && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Selecciona un departamento para ver unidades.
                  </p>
                )}
                {departamentoSeleccionadoId && (
                  <div className="space-y-2">
                    {unidades.length === 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Este departamento aun no tiene unidades.
                      </p>
                    )}
                    {unidades.map((unidad: any) => (
                      <button
                        key={unidad.id}
                        type="button"
                        onClick={() => setUnidadSeleccionadaId(unidad.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                          unidadSeleccionadaId === unidad.id
                            ? "border-indigo-500 bg-indigo-50/80 dark:bg-white/10"
                            : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {unidad.nombre}
                          </p>
                          {unidad.codigo && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{unidad.codigo}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Usuarios: {unidad._count?.usuarios ?? 0}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isAdmin && departamentoSeleccionadoId && (
                  <>
                    <Separator className="bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Nueva unidad</p>
                      <Input
                        placeholder="Nombre"
                        value={nuevaUnidad.nombre}
                        onChange={(e) =>
                          setNuevaUnidad((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Input
                        placeholder="Codigo (opcional)"
                        value={nuevaUnidad.codigo}
                        onChange={(e) =>
                          setNuevaUnidad((prev) => ({ ...prev, codigo: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Textarea
                        placeholder="Descripcion (opcional)"
                        value={nuevaUnidad.descripcion}
                        onChange={(e) =>
                          setNuevaUnidad((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                      />
                      <Button
                        onClick={handleCrearUnidad}
                        disabled={creandoUnidad}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {creandoUnidad ? "Creando..." : "Crear unidad"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
                  Miembros
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Asigna usuarios a departamentos y unidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Miembros del departamento
                  </p>
                  {departamentoUsuarios.length === 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No hay miembros asignados.
                    </p>
                  )}
                  {departamentoUsuarios.map((miembro: any) => (
                    <div
                      key={miembro.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {miembro.user?.name || miembro.user?.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {miembro.user?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{miembro.rol}</Badge>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuitarUsuarioDepartamento(miembro.userId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAdmin && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select
                        value={nuevoMiembroDepartamento.userId}
                        onValueChange={(value) =>
                          setNuevoMiembroDepartamento((prev) => ({ ...prev, userId: value }))
                        }
                      >
                        <SelectTrigger className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10">
                          <SelectValue placeholder="Selecciona usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuariosActivos.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={nuevoMiembroDepartamento.rol}
                        onValueChange={(value) =>
                          setNuevoMiembroDepartamento((prev) => ({ ...prev, rol: value }))
                        }
                      >
                        <SelectTrigger className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10">
                          <SelectValue placeholder="Rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="MIEMBRO">MIEMBRO</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAgregarUsuarioDepartamento}
                        disabled={agregandoDepto}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 md:col-span-2"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {agregandoDepto ? "Agregando..." : "Agregar usuario"}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-200 dark:bg-white/10" />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Miembros de la unidad
                  </p>
                  {unidadUsuarios.length === 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No hay miembros asignados.
                    </p>
                  )}
                  {unidadUsuarios.map((miembro: any) => (
                    <div
                      key={miembro.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {miembro.user?.name || miembro.user?.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {miembro.user?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{miembro.rol}</Badge>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuitarUsuarioUnidad(miembro.userId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAdmin && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select
                        value={nuevoMiembroUnidad.userId}
                        onValueChange={(value) =>
                          setNuevoMiembroUnidad((prev) => ({ ...prev, userId: value }))
                        }
                      >
                        <SelectTrigger className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10">
                          <SelectValue placeholder="Selecciona usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuariosActivos.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={nuevoMiembroUnidad.rol}
                        onValueChange={(value) =>
                          setNuevoMiembroUnidad((prev) => ({ ...prev, rol: value }))
                        }
                      >
                        <SelectTrigger className="border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10">
                          <SelectValue placeholder="Rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="MIEMBRO">MIEMBRO</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAgregarUsuarioUnidad}
                        disabled={agregandoUnidad}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 md:col-span-2"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {agregandoUnidad ? "Agregando..." : "Agregar usuario"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
