"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Calendar, Download, Eye, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LicitacionesPage() {
  const [activeTab, setActiveTab] = useState("guardadas");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importando, setImportando] = useState<string | null>(null);

  const estadoParamMap: Record<string, string> = {
    all: "todos",
    Activa: "activas",
    "En Preparación": "publicada",
    Adjudicada: "adjudicada",
    Vencida: "cerrada",
  };

  const estadoParam = estadoParamMap[statusFilter] ?? "todos";

  // Fetch para licitaciones guardadas en BD
  const { data: savedData, error: savedError, isLoading: savedLoading, mutate: mutateSaved } = useSWR(
    "/api/licitaciones",
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener licitaciones guardadas");
      return res.json();
    },
    { refreshInterval: 20000 }
  );

  // Fetch para búsqueda en Mercado Público
  const { data: searchData, error: searchError, isLoading: searchLoading } = useSWR(
    searchTerm ? `/api/licitaciones/search?q=${encodeURIComponent(searchTerm)}&estado=${estadoParam}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener licitaciones");
      return res.json();
    },
    { refreshInterval: 20000 }
  );

  const licitacionesGuardadas = (savedData?.licitaciones as any[]) ?? [];
  const licitacionesBusqueda = (searchData?.items as any[]) ?? [];

  const filteredLicitacionesGuardadas = useMemo(() => {
    return licitacionesGuardadas.filter((licitacion: any) => {
      const matchesStatus = statusFilter === "all" || licitacion.estado === statusFilter;
      return matchesStatus;
    });
  }, [licitacionesGuardadas, statusFilter]);

  const filteredLicitacionesBusqueda = useMemo(() => {
    return licitacionesBusqueda.filter((licitacion: any) => {
      const matchesSearch =
        licitacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licitacion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licitacion.institucion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || licitacion.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [licitacionesBusqueda, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activa":
        return "default";
      case "En Preparación":
        return "secondary";
      case "Adjudicada":
        return "outline";
      case "Vencida":
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

  const handleImportar = async (licitacion: any) => {
    setImportando(licitacion.id);
    try {
      const res = await fetch("/api/licitaciones/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: licitacion.rawData }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Esta licitación ya fue importada previamente");
        } else {
          toast.error(data.error || "Error al importar licitación");
        }
        return;
      }

      toast.success("Licitación importada correctamente");
      mutateSaved(); // Recargar licitaciones guardadas
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al importar licitación");
    } finally {
      setImportando(null);
    }
  };

  const totalActivas = licitacionesGuardadas.filter((l: any) => l.estado?.toLowerCase().includes("activa")).length;
  const proximas = licitacionesGuardadas.filter((l: any) => (l.diasRestantes ?? 99) <= 7).length;
  const totalMonto = licitacionesGuardadas.reduce((acc: number, l: any) => acc + (parseFloat(l.montoEstimado) || 0), 0);
  const adjudicadas = licitacionesGuardadas.filter((l: any) => l.estado?.toLowerCase().includes("adju")).length;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Licitaciones</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de licitaciones</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200">Administra y da seguimiento a licitaciones públicas</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActivas}</div>
                <p className="text-xs text-slate-600 dark:text-slate-200">En proceso</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas a Vencer</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proximas}</div>
                <p className="text-xs text-slate-600 dark:text-slate-200">Menos de 7 días</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                <span className="text-sm text-slate-600 dark:text-slate-200">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalMonto}K</div>
                <p className="text-xs text-slate-600 dark:text-slate-200">Licitaciones activas</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adjudicadas</CardTitle>
                <span className="text-sm text-slate-600 dark:text-slate-200">✓</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adjudicadas}</div>
                <p className="text-xs text-slate-600 dark:text-slate-200">Este mes</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/90 dark:bg-white/10">
              <TabsTrigger value="guardadas" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                Licitaciones Guardadas
              </TabsTrigger>
              <TabsTrigger value="buscar" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                Buscar en Mercado Público
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guardadas" className="space-y-4">
              <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-white">Mis Licitaciones</CardTitle>
                    <CardDescription className="text-slate-300">
                      Licitaciones guardadas en el sistema
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px] border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="ACTIVA">Activa</SelectItem>
                        <SelectItem value="EN_PREPARACION">En Preparación</SelectItem>
                        <SelectItem value="ADJUDICADA">Adjudicada</SelectItem>
                        <SelectItem value="DESIERTA">Desierta</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedError && <p className="text-sm text-red-300">No se pudo obtener licitaciones guardadas.</p>}
                  {savedLoading && <p className="text-sm text-slate-600 dark:text-slate-300">Cargando licitaciones...</p>}
                  {!savedLoading && filteredLicitacionesGuardadas.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Aún no hay licitaciones guardadas. Busca e importa licitaciones desde Mercado Público.
                      </p>
                      <Button variant="default" onClick={() => setActiveTab("buscar")} className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
                        <Search className="mr-2 h-4 w-4" />
                        Buscar Licitaciones
                      </Button>
                    </div>
                  )}
                  {!savedError && filteredLicitacionesGuardadas.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white/10">
                          <TableRow>
                            <TableHead className="text-white">Código</TableHead>
                            <TableHead className="text-white">Nombre</TableHead>
                            <TableHead className="text-white">Entidad</TableHead>
                            <TableHead className="text-white">Publicación</TableHead>
                            <TableHead className="text-white">Cierre</TableHead>
                            <TableHead className="text-white">Monto</TableHead>
                            <TableHead className="text-white">Estado</TableHead>
                            <TableHead className="text-white">Restante</TableHead>
                            <TableHead className="text-white">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLicitacionesGuardadas.map((licitacion: any) => (
                            <TableRow key={licitacion.id} className="hover:bg-white/5">
                              <TableCell className="text-slate-300">{licitacion.codigoExterno || "N/A"}</TableCell>
                              <TableCell className="font-medium text-slate-900 dark:text-white">{licitacion.nombre}</TableCell>
                              <TableCell className="text-slate-300">{licitacion.entidad}</TableCell>
                              <TableCell className="text-slate-300">
                                {licitacion.fechaPublicacion
                                  ? new Date(licitacion.fechaPublicacion).toLocaleDateString('es-CL')
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {licitacion.fechaCierre
                                  ? new Date(licitacion.fechaCierre).toLocaleDateString('es-CL')
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {licitacion.montoEstimado
                                  ? `$${(parseFloat(licitacion.montoEstimado) / 1000000).toFixed(1)}M`
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(licitacion.estado)} className="text-white">
                                  {licitacion.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className={getDaysColor(licitacion.diasRestantes ?? 0)}>
                                {licitacion.diasRestantes !== undefined ? `${licitacion.diasRestantes} días` : "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="default"
                                  asChild
                                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                                >
                                  <Link href={`/licitaciones/${licitacion.id}`}>
                                    <Eye className="mr-1 h-3 w-3" />
                                    Ver
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buscar" className="space-y-4">
              <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">Búsqueda de licitación</CardTitle>
                  <CardDescription className="text-slate-300">
                    Pega el código exacto (ej: 1057472-106-LR24) o busca por nombre/institución.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-600 dark:text-slate-300" />
                      <Input
                        placeholder="Código de licitación o texto..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="border-white/20 bg-white/90 dark:bg-white/10 pl-8 text-slate-900 dark:text-white placeholder:text-slate-300"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px] border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="En Preparación">En Preparación</SelectItem>
                        <SelectItem value="Adjudicada">Adjudicada</SelectItem>
                        <SelectItem value="Vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => setSearchTerm(searchInput)}
                      variant="default"
                      className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Resultados de Búsqueda</CardTitle>
                  <CardDescription className="text-slate-300">
                    Licitaciones encontradas en Mercado Público
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchError && <p className="text-sm text-red-300">No se pudo obtener licitaciones.</p>}
                  {searchLoading && <p className="text-sm text-slate-600 dark:text-slate-300">Cargando licitaciones...</p>}
                  {!searchLoading && !searchTerm && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Ingresa un código o texto para buscar licitaciones en Mercado Público.
                      </p>
                    </div>
                  )}
                  {!searchLoading && searchTerm && filteredLicitacionesBusqueda.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 px-6 py-8 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        No se encontraron licitaciones que coincidan con tu búsqueda.
                      </p>
                    </div>
                  )}
                  {!searchError && filteredLicitacionesBusqueda.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white/10">
                          <TableRow>
                            <TableHead className="text-white">ID</TableHead>
                            <TableHead className="text-white">Nombre</TableHead>
                            <TableHead className="text-white">Institución</TableHead>
                            <TableHead className="text-white">Publicación</TableHead>
                            <TableHead className="text-white">Cierre</TableHead>
                            <TableHead className="text-white">Monto</TableHead>
                            <TableHead className="text-white">Estado</TableHead>
                            <TableHead className="text-white">Restante</TableHead>
                            <TableHead className="text-white">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLicitacionesBusqueda.map((licitacion: any) => (
                            <TableRow key={licitacion.id} className="hover:bg-white/5">
                              <TableCell className="text-slate-300">{licitacion.codigo}</TableCell>
                              <TableCell className="font-medium text-slate-900 dark:text-white">{licitacion.nombre}</TableCell>
                              <TableCell className="text-slate-300">{licitacion.institucion}</TableCell>
                              <TableCell className="text-slate-300">{licitacion.fechaPublicacion}</TableCell>
                              <TableCell className="text-slate-300">{licitacion.fechaCierre}</TableCell>
                              <TableCell className="text-slate-300">{licitacion.montoEstimado}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(licitacion.estado)} className="text-white">
                                  {licitacion.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className={getDaysColor(licitacion.diasRestantes ?? 0)}>
                                {licitacion.diasRestantes ?? "-"} días
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleImportar(licitacion)}
                                  disabled={importando === licitacion.id}
                                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                                >
                                  {importando === licitacion.id ? (
                                    <>Guardando...</>
                                  ) : (
                                    <>
                                      <Download className="mr-1 h-3 w-3" />
                                      Guardar
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
