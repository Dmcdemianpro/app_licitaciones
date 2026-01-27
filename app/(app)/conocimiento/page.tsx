"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { BookOpen, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

type Categoria = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  slug: string;
  activo: boolean;
  _count?: { articulos: number };
};

type Articulo = {
  id: string;
  titulo: string;
  resumen?: string | null;
  slug: string;
  contenido: string;
  publicado: boolean;
  vistas: number;
  categoria?: Categoria | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ConocimientoPage() {
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);
  const role = sessionData?.user?.role ?? "";
  const isAdmin = ["ADMIN", "SUPERVISOR"].includes(role);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");
  const [soloPublicados, setSoloPublicados] = useState(!isAdmin);

  const categoriasUrl = isAdmin
    ? "/api/conocimiento/categorias"
    : "/api/conocimiento/categorias?soloActivos=true";
  const { data: categoriasData, mutate: mutateCategorias } = useSWR(
    categoriasUrl,
    fetcher
  );
  const categorias: Categoria[] = categoriasData?.categorias ?? [];

  const articulosUrl = `/api/conocimiento/articulos?soloPublicados=${soloPublicados || !isAdmin}`;
  const { data: articulosData, mutate: mutateArticulos } = useSWR(
    articulosUrl,
    fetcher
  );
  const articulos: Articulo[] = articulosData?.articulos ?? [];

  const articulosFiltrados = useMemo(() => {
    return articulos.filter((articulo) => {
      const matchesSearch =
        articulo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (articulo.resumen ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria =
        categoriaFiltro === "all" ||
        articulo.categoria?.id === categoriaFiltro;
      return matchesSearch && matchesCategoria;
    });
  }, [articulos, categoriaFiltro, searchTerm]);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });
  const [nuevoArticulo, setNuevoArticulo] = useState({
    titulo: "",
    resumen: "",
    contenido: "",
    categoriaId: "",
    publicado: false,
  });

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.nombre.trim()) {
      toast.error("Nombre requerido,");
      return;
    }

    const res = await fetch("/api/conocimiento/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nuevaCategoria.nombre.trim(),
        descripcion: nuevaCategoria.descripcion.trim() || null,
        activo: nuevaCategoria.activo,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al crear categoria");
      return;
    }

    toast.success("Categoria creada");
    setNuevaCategoria({ nombre: "", descripcion: "", activo: true });
    mutateCategorias();
  };

  const handleCrearArticulo = async () => {
    if (!nuevoArticulo.titulo.trim() || !nuevoArticulo.contenido.trim()) {
      toast.error("Titulo y contenido requeridos");
      return;
    }

    const res = await fetch("/api/conocimiento/articulos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: nuevoArticulo.titulo.trim(),
        resumen: nuevoArticulo.resumen.trim() || null,
        contenido: nuevoArticulo.contenido.trim(),
        categoriaId: nuevoArticulo.categoriaId || null,
        publicado: nuevoArticulo.publicado,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al crear articulo");
      return;
    }

    toast.success("Articulo creado");
    setNuevoArticulo({
      titulo: "",
      resumen: "",
      contenido: "",
      categoriaId: "",
      publicado: false,
    });
    mutateArticulos();
  };

  const handleToggleCategoria = async (categoria: Categoria) => {
    await fetch(`/api/conocimiento/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !categoria.activo }),
    });
    mutateCategorias();
  };

  const handleEliminarCategoria = async (categoria: Categoria) => {
    if (!confirm(`Eliminar categoria ${categoria.nombre}?`)) return;
    await fetch(`/api/conocimiento/categorias/${categoria.id}`, { method: "DELETE" });
    mutateCategorias();
  };

  const handleToggleArticulo = async (articulo: Articulo) => {
    await fetch(`/api/conocimiento/articulos/${articulo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !articulo.publicado }),
    });
    mutateArticulos();
  };

  const handleEliminarArticulo = async (articulo: Articulo) => {
    if (!confirm(`Eliminar articulo ${articulo.titulo}?`)) return;
    await fetch(`/api/conocimiento/articulos/${articulo.id}`, { method: "DELETE" });
    mutateArticulos();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Conocimiento
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Base de conocimiento y autoservicio
            </h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              Encuentra respuestas y guias antes de abrir un ticket
            </p>
          </div>
        </div>
        <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-500">
          <BookOpen className="h-5 w-5" />
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Explorar articulos</CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-200">
              Busca por palabra clave y filtra por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
                <Input
                  placeholder="Buscar articulos"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Select
                  value={soloPublicados ? "publicados" : "todos"}
                  onValueChange={(value) => setSoloPublicados(value === "publicados")}
                >
                  <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publicados">Solo publicados</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {articulosFiltrados.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 p-6 text-center text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
                  No hay articulos para mostrar.
                </div>
              )}
              {articulosFiltrados.map((articulo) => (
                <Link key={articulo.id} href={`/conocimiento/${articulo.slug}`}>
                  <Card className="h-full border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">{articulo.titulo}</CardTitle>
                      <CardDescription className="text-slate-700 dark:text-slate-200">
                        {articulo.resumen || articulo.contenido.slice(0, 120) + "..."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{articulo.categoria?.nombre || "General"}</span>
                      <Badge variant={articulo.publicado ? "default" : "secondary"}>
                        {articulo.publicado ? "Publicado" : "Borrador"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Administracion de conocimiento</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">
                Crea categorias y articulos para el portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre categoria</Label>
                  <Input
                    value={nuevaCategoria.nombre}
                    onChange={(e) =>
                      setNuevaCategoria((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripcion</Label>
                  <Input
                    value={nuevaCategoria.descripcion}
                    onChange={(e) =>
                      setNuevaCategoria((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={nuevaCategoria.activo ? "true" : "false"}
                    onValueChange={(value) =>
                      setNuevaCategoria((prev) => ({ ...prev, activo: value === "true" }))
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
                <div className="flex items-end justify-end">
                  <Button onClick={handleCrearCategoria}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear categoria
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-3"
                  >
                    <div>
                      <p className="font-medium">{categoria.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {categoria._count?.articulos ?? 0} articulos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleToggleCategoria(categoria)}
                        className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                      >
                        {categoria.activo ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEliminarCategoria(categoria)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titulo articulo</Label>
                  <Input
                    value={nuevoArticulo.titulo}
                    onChange={(e) =>
                      setNuevoArticulo((prev) => ({ ...prev, titulo: e.target.value }))
                    }
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={nuevoArticulo.categoriaId || "none"}
                    onValueChange={(value) =>
                      setNuevoArticulo((prev) => ({
                        ...prev,
                        categoriaId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Resumen</Label>
                  <Textarea
                    value={nuevoArticulo.resumen}
                    onChange={(e) =>
                      setNuevoArticulo((prev) => ({ ...prev, resumen: e.target.value }))
                    }
                    rows={2}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Contenido</Label>
                  <Textarea
                    value={nuevoArticulo.contenido}
                    onChange={(e) =>
                      setNuevoArticulo((prev) => ({ ...prev, contenido: e.target.value }))
                    }
                    rows={6}
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={nuevoArticulo.publicado ? "true" : "false"}
                    onValueChange={(value) =>
                      setNuevoArticulo((prev) => ({ ...prev, publicado: value === "true" }))
                    }
                  >
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Publicado</SelectItem>
                      <SelectItem value="false">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-end md:col-span-2">
                  <Button onClick={handleCrearArticulo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear articulo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {articulos.map((articulo) => (
                  <div
                    key={articulo.id}
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/80 dark:bg-white/5 p-3"
                  >
                    <div>
                      <p className="font-medium">{articulo.titulo}</p>
                      <p className="text-xs text-slate-500">
                        {articulo.categoria?.nombre || "General"} • {articulo.vistas} vistas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleToggleArticulo(articulo)}
                        className="border-white/20 text-slate-900 dark:text-white hover:bg-white/10"
                      >
                        {articulo.publicado ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEliminarArticulo(articulo)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
