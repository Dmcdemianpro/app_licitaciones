"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Calendar, Plus, Search } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LicitacionesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const estadoParamMap: Record<string, string> = {
    all: "todos",
    Activa: "activas",
    "En Preparación": "publicada",
    Adjudicada: "adjudicada",
    Vencida: "cerrada",
  };

  const estadoParam = estadoParamMap[statusFilter] ?? "todos";

  const { data, error, isLoading } = useSWR(
    searchTerm ? `/api/licitaciones/search?q=${encodeURIComponent(searchTerm)}&estado=${estadoParam}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener licitaciones");
      return res.json();
    },
    { refreshInterval: 20000 }
  );

  const licitaciones = (data?.items as any[]) ?? [];

  const filteredLicitaciones = useMemo(() => {
    return licitaciones.filter((licitacion) => {
      const matchesSearch =
        licitacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licitacion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licitacion.institucion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || licitacion.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [licitaciones, searchTerm, statusFilter]);

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

  const totalActivas = licitaciones.filter((l) => l.estado?.toLowerCase().includes("activa")).length;
  const proximas = licitaciones.filter((l) => (l.diasRestantes ?? 99) <= 7).length;
  const totalMonto = licitaciones.reduce((acc, _l) => acc, 0);
  const adjudicadas = licitaciones.filter((l) => l.estado?.toLowerCase().includes("adju")).length;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Licitaciones</p>
            <h1 className="text-3xl font-bold text-white">Gestión de licitaciones</h1>
            <p className="text-sm text-slate-200">Administra y da seguimiento a licitaciones públicas</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-white/10 bg-white/10 text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
                <Calendar className="h-4 w-4 text-indigo-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActivas}</div>
                <p className="text-xs text-slate-200">En proceso</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas a Vencer</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proximas}</div>
                <p className="text-xs text-slate-200">Menos de 7 días</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                <span className="text-sm text-slate-200">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalMonto}K</div>
                <p className="text-xs text-slate-200">Licitaciones activas</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white shadow-lg backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adjudicadas</CardTitle>
                <span className="text-sm text-slate-200">✓</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adjudicadas}</div>
                <p className="text-xs text-slate-200">Este mes</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle>Búsqueda de licitación</CardTitle>
              <CardDescription className="text-slate-200">
                Pega el código exacto (ej: 1057472-106-LR24) o busca por nombre/institución.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-300" />
                  <Input
                    placeholder="Código de licitación o texto..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border-white/20 bg-white/10 pl-8 text-white placeholder:text-slate-300"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px] border-white/20 bg-white/10 text-white">
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
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:from-indigo-400 hover:to-purple-400"
                >
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Lista de Licitaciones</CardTitle>
              <CardDescription className="text-slate-200">
                Conecta tu fuente de licitaciones para verlas aquí.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-sm text-red-300">No se pudo obtener licitaciones.</p>}
              {isLoading && <p className="text-sm text-slate-200">Cargando licitaciones...</p>}
              {!isLoading && filteredLicitaciones.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                  <p className="text-sm text-slate-200">
                    Aún no hay licitaciones registradas o coincidentes. Agrega una nueva para comenzar.
                  </p>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:from-indigo-400 hover:to-purple-400">
                    <Link href="/licitaciones/nueva">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear licitación
                    </Link>
                  </Button>
                </div>
              )}
              {!error && filteredLicitaciones.length > 0 && (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLicitaciones.map((licitacion) => (
                        <TableRow key={licitacion.id} className="hover:bg-white/5">
                          <TableCell className="text-slate-200">{licitacion.codigo}</TableCell>
                          <TableCell className="font-medium text-white">{licitacion.nombre}</TableCell>
                          <TableCell className="text-slate-200">{licitacion.institucion}</TableCell>
                          <TableCell className="text-slate-200">{licitacion.fechaPublicacion}</TableCell>
                          <TableCell className="text-slate-200">{licitacion.fechaCierre}</TableCell>
                          <TableCell className="text-slate-200">{licitacion.montoEstimado}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(licitacion.estado)}>{licitacion.estado}</Badge>
                          </TableCell>
                          <TableCell className={getDaysColor(licitacion.diasRestantes ?? 0)}>
                            {licitacion.diasRestantes ?? "-"} días
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
