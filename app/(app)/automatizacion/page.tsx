"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Plus, Sliders, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Regla = {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  ticketType?: string | null;
  priority?: string | null;
  targetRole?: string | null;
  targetUserId?: string | null;
  maxActive?: number | null;
  targetUser?: {
    id: string;
    name: string | null;
    email: string;
    role?: string | null;
    activo?: boolean | null;
  } | null;
};

type Macro = {
  id: string;
  titulo: string;
  contenido: string;
  entidad: string;
  activo: boolean;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AutomatizacionPage() {
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);
  const role = sessionData?.user?.role ?? "";
  const canManage = ["ADMIN", "SUPERVISOR"].includes(role);

  const { data: reglasData, mutate: mutateReglas } = useSWR(
    canManage ? "/api/automatizacion/reglas-asignacion" : null,
    fetcher
  );
  const reglas: Regla[] = reglasData?.reglas ?? [];

  const { data: macrosData, mutate: mutateMacros } = useSWR(
    canManage ? "/api/automatizacion/macros" : null,
    fetcher
  );
  const macros: Macro[] = macrosData?.macros ?? [];

  const { data: usuariosData } = useSWR(canManage ? "/api/usuarios" : null, fetcher);
  const usuarios = usuariosData?.users ?? [];
  const usuariosActivos = useMemo(
    () => usuarios.filter((user: any) => user.activo !== false),
    [usuarios]
  );

  const [nuevaRegla, setNuevaRegla] = useState({
    nombre: "",
    ticketType: "",
    priority: "",
    targetRole: "",
    targetUserId: "",
    orden: 1,
    maxActive: "",
    activo: true,
  });
  const [nuevaMacro, setNuevaMacro] = useState({
    titulo: "",
    contenido: "",
    entidad: "TICKET",
    activo: true,
  });

  const [creandoRegla, setCreandoRegla] = useState(false);
  const [creandoMacro, setCreandoMacro] = useState(false);

  const handleCrearRegla = async () => {
    if (!nuevaRegla.nombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    setCreandoRegla(true);
    try {
      const payload = {
        nombre: nuevaRegla.nombre.trim(),
        ticketType: nuevaRegla.ticketType.trim() || null,
        priority: nuevaRegla.priority || null,
        targetRole: nuevaRegla.targetRole || null,
        targetUserId: nuevaRegla.targetUserId || null,
        orden: nuevaRegla.orden,
        maxActive: nuevaRegla.maxActive === "" ? null : Number(nuevaRegla.maxActive),
        activo: nuevaRegla.activo,
      };

      const res = await fetch("/api/automatizacion/reglas-asignacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al crear regla");
        return;
      }

      toast.success("Regla creada");
      setNuevaRegla({
        nombre: "",
        ticketType: "",
        priority: "",
        targetRole: "",
        targetUserId: "",
        orden: 1,
        maxActive: "",
        activo: true,
      });
      mutateReglas();
    } catch (error) {
      toast.error("Error al crear regla");
    } finally {
      setCreandoRegla(false);
    }
  };

  const handleCrearMacro = async () => {
    if (!nuevaMacro.titulo.trim() || !nuevaMacro.contenido.trim()) {
      toast.error("Titulo y contenido requeridos");
      return;
    }

    setCreandoMacro(true);
    try {
      const res = await fetch("/api/automatizacion/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: nuevaMacro.titulo.trim(),
          contenido: nuevaMacro.contenido.trim(),
          entidad: nuevaMacro.entidad,
          activo: nuevaMacro.activo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al crear macro");
        return;
      }

      toast.success("Macro creada");
      setNuevaMacro({
        titulo: "",
        contenido: "",
        entidad: "TICKET",
        activo: true,
      });
      mutateMacros();
    } catch (error) {
      toast.error("Error al crear macro");
    } finally {
      setCreandoMacro(false);
    }
  };

  const handleToggleRegla = async (regla: Regla) => {
    try {
      await fetch(`/api/automatizacion/reglas-asignacion/${regla.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !regla.activo }),
      });
      mutateReglas();
    } catch (error) {
      toast.error("No se pudo actualizar la regla");
    }
  };

  const handleEliminarRegla = async (regla: Regla) => {
    if (!confirm(`Eliminar la regla ${regla.nombre}?`)) return;
    try {
      await fetch(`/api/automatizacion/reglas-asignacion/${regla.id}`, {
        method: "DELETE",
      });
      mutateReglas();
    } catch (error) {
      toast.error("No se pudo eliminar la regla");
    }
  };

  const handleToggleMacro = async (macro: Macro) => {
    try {
      await fetch(`/api/automatizacion/macros/${macro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !macro.activo }),
      });
      mutateMacros();
    } catch (error) {
      toast.error("No se pudo actualizar la macro");
    }
  };

  const handleEliminarMacro = async (macro: Macro) => {
    if (!confirm(`Eliminar la macro ${macro.titulo}?`)) return;
    try {
      await fetch(`/api/automatizacion/macros/${macro.id}`, {
        method: "DELETE",
      });
      mutateMacros();
    } catch (error) {
      toast.error("No se pudo eliminar la macro");
    }
  };

  if (!canManage) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Automatizacion
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Acceso restringido
            </h1>
          </div>
        </header>
        <div className="flex-1 p-6">
          <Card className="max-w-xl border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Solo administradores o supervisores pueden gestionar automatizaciones.
              </p>
            </CardContent>
          </Card>
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Automatizacion
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Reglas y macros
            </h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Define asignaciones automaticas y respuestas rapidas
            </p>
          </div>
        </div>
        <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-500">
          <Sliders className="h-5 w-5" />
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Reglas de asignacion</CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-200">
              Prioriza reglas por orden. Si eliges usuario, se usa antes que rol.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <Label>Nombre</Label>
                <Input
                  value={nuevaRegla.nombre}
                  onChange={(e) => setNuevaRegla((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo ticket</Label>
                <Input
                  value={nuevaRegla.ticketType}
                  onChange={(e) => setNuevaRegla((prev) => ({ ...prev, ticketType: e.target.value }))}
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={nuevaRegla.priority}
                  onValueChange={(value) =>
                    setNuevaRegla((prev) => ({
                      ...prev,
                      priority: value === "ANY" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Cualquiera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Cualquiera</SelectItem>
                    <SelectItem value="ALTA">ALTA</SelectItem>
                    <SelectItem value="MEDIA">MEDIA</SelectItem>
                    <SelectItem value="BAJA">BAJA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rol destino</Label>
                <Select
                  value={nuevaRegla.targetRole}
                  onValueChange={(value) =>
                    setNuevaRegla((prev) => ({
                      ...prev,
                      targetRole: value === "NONE" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin rol</SelectItem>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Usuario destino</Label>
                <Select
                  value={nuevaRegla.targetUserId}
                  onValueChange={(value) =>
                    setNuevaRegla((prev) => ({
                      ...prev,
                      targetUserId: value === "NONE" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin usuario</SelectItem>
                    {usuariosActivos.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={nuevaRegla.orden}
                  onChange={(e) =>
                    setNuevaRegla((prev) => ({ ...prev, orden: Number(e.target.value) }))
                  }
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Max activos</Label>
                <Input
                  type="number"
                  value={nuevaRegla.maxActive}
                  onChange={(e) => setNuevaRegla((prev) => ({ ...prev, maxActive: e.target.value }))}
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={nuevaRegla.activo ? "true" : "false"}
                  onValueChange={(value) =>
                    setNuevaRegla((prev) => ({ ...prev, activo: value === "true" }))
                  }
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCrearRegla}
                disabled={creandoRegla}
                className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {creandoRegla ? "Creando..." : "Crear regla"}
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 shadow-lg">
              <Table>
                <TableHeader className="bg-white/10">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Nombre</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Tipo</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Prioridad</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Destino</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Max</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reglas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-slate-500">
                        No hay reglas aun.
                      </TableCell>
                    </TableRow>
                  )}
                  {reglas.map((regla) => (
                    <TableRow key={regla.id} className="hover:bg-white/5">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{regla.nombre}</span>
                          <span className="text-xs text-slate-500">Orden {regla.orden}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-200">
                        {regla.ticketType || "Cualquiera"}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-200">
                        {regla.priority || "Cualquiera"}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-200">
                        {regla.targetUser
                          ? regla.targetUser.name || regla.targetUser.email
                          : regla.targetRole
                            ? `Rol ${regla.targetRole}`
                            : "Sin destino"}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-200">
                        {regla.maxActive ?? "Sin limite"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={regla.activo ? "default" : "secondary"}>
                          {regla.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleToggleRegla(regla)}
                          className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                        >
                          {regla.activo ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEliminarRegla(regla)}
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Macros de respuesta</CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-200">
              Plantillas para bitacora y mensajes rapidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={nuevaMacro.titulo}
                  onChange={(e) => setNuevaMacro((prev) => ({ ...prev, titulo: e.target.value }))}
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Entidad</Label>
                <Select
                  value={nuevaMacro.entidad}
                  onValueChange={(value) => setNuevaMacro((prev) => ({ ...prev, entidad: value }))}
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TICKET">TICKET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Contenido</Label>
                <Textarea
                  value={nuevaMacro.contenido}
                  onChange={(e) => setNuevaMacro((prev) => ({ ...prev, contenido: e.target.value }))}
                  rows={4}
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={nuevaMacro.activo ? "true" : "false"}
                  onValueChange={(value) =>
                    setNuevaMacro((prev) => ({ ...prev, activo: value === "true" }))
                  }
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end md:col-span-2">
                <Button
                  onClick={handleCrearMacro}
                  disabled={creandoMacro}
                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creandoMacro ? "Creando..." : "Crear macro"}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 shadow-lg">
              <Table>
                <TableHeader className="bg-white/10">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Titulo</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Entidad</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {macros.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                        No hay macros aun.
                      </TableCell>
                    </TableRow>
                  )}
                  {macros.map((macro) => (
                    <TableRow key={macro.id} className="hover:bg-white/5">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{macro.titulo}</span>
                          <span className="text-xs text-slate-500">
                            {macro.contenido.slice(0, 60)}
                            {macro.contenido.length > 60 ? "..." : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-200">
                        {macro.entidad}
                      </TableCell>
                      <TableCell>
                        <Badge variant={macro.activo ? "default" : "secondary"}>
                          {macro.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleToggleMacro(macro)}
                          className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                        >
                          {macro.activo ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEliminarMacro(macro)}
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
