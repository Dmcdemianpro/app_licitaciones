"use client";

import { useState } from "react";
import { BarChart3, Download, FileText, PieChart, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ReportesPage() {
  const [filtros, setFiltros] = useState({
    tipoReporte: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const reportesDisponibles = [
    { id: "tickets-resumen", nombre: "Resumen de Tickets", descripcion: "Estadísticas generales por período", icono: FileText, categoria: "Tickets" },
    { id: "licitaciones-activas", nombre: "Licitaciones Activas", descripcion: "Estado actual de licitaciones", icono: BarChart3, categoria: "Licitaciones" },
    { id: "licitaciones-historico", nombre: "Histórico de Licitaciones", descripcion: "Adjudicaciones y evolución", icono: PieChart, categoria: "Licitaciones" },
  ];

  const generarReporte = () => {
    console.log("Generando reporte con filtros:", filtros);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <SidebarTrigger />
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Reportes</p>
          <h1 className="text-3xl font-bold text-white">Reportes y análisis</h1>
          <p className="text-sm text-slate-200">Genera reportes personalizados y explora plantillas.</p>
        </div>
      </header>

      <div className="flex-1 space-y-6 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Generar nuevo reporte</CardTitle>
              <CardDescription className="text-slate-200">
                Configura los parámetros para exportar un reporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de reporte</Label>
                  <Select
                    value={filtros.tipoReporte}
                    onValueChange={(value) => setFiltros((prev) => ({ ...prev, tipoReporte: value }))}
                  >
                    <SelectTrigger className="border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets-resumen">Resumen de Tickets</SelectItem>
                      <SelectItem value="licitaciones-activas">Licitaciones Activas</SelectItem>
                      <SelectItem value="licitaciones-historico">Histórico de Licitaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                    className="border-white/20 bg-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
                    className="border-white/20 bg-white/10 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={generarReporte}
                variant="primary"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Generar reporte
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Plantillas de reporte</CardTitle>
              <CardDescription className="text-slate-200">Explora los tipos de reportes disponibles.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {reportesDisponibles.map((reporte) => (
                <div
                  key={reporte.id}
                  className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur"
                >
                  <div className="rounded-md bg-indigo-500/20 p-2">
                    <reporte.icono className="h-4 w-4 text-indigo-200" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{reporte.nombre}</p>
                    <p className="text-sm text-slate-200">{reporte.descripcion}</p>
                  </div>
                  <Badge variant="secondary">{reporte.categoria}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Reportes recientes</CardTitle>
              <CardDescription className="text-slate-200">Historial de descargas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                <Sparkles className="h-6 w-6 text-indigo-300" />
                <p className="text-sm text-slate-200">
                  Aún no hay reportes generados. Usa el generador para crear el primero.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
