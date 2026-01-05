"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

type CitaForm = {
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion: string;
  urlReunion: string;
};

export default function EditarCitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<CitaForm>({
    titulo: "",
    descripcion: "",
    tipo: "REUNION",
    estado: "PROGRAMADA",
    fechaInicio: "",
    fechaFin: "",
    ubicacion: "",
    urlReunion: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCita = async () => {
      try {
        const res = await fetch(`/api/citas/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la cita");
        }
        const data = await res.json();

        // Convert ISO dates to datetime-local format
        const fechaInicio = new Date(data.cita.fechaInicio);
        const fechaFin = new Date(data.cita.fechaFin);

        setForm({
          titulo: data.cita.titulo,
          descripcion: data.cita.descripcion || "",
          tipo: data.cita.tipo,
          estado: data.cita.estado,
          fechaInicio: fechaInicio.toISOString().slice(0, 16),
          fechaFin: fechaFin.toISOString().slice(0, 16),
          ubicacion: data.cita.ubicacion || "",
          urlReunion: data.cita.urlReunion || "",
        });
      } catch (err) {
        setError("No se pudo cargar la cita");
      } finally {
        setLoading(false);
      }
    };

    fetchCita();
  }, [id]);

  const handleChange = (key: keyof CitaForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion || null,
          tipo: form.tipo,
          estado: form.estado,
          fechaInicio: new Date(form.fechaInicio).toISOString(),
          fechaFin: new Date(form.fechaFin).toISOString(),
          ubicacion: form.ubicacion || null,
          urlReunion: form.urlReunion || null,
        }),
      });

      if (res.ok) {
        router.push(`/citas/${id}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo actualizar la cita");
      }
    } catch (err) {
      setError("Error al actualizar la cita");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar cita</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error && !form.titulo) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar cita</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-300">{error}</p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
                <Link href="/citas">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a citas
                </Link>
              </Button>
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Citas</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar cita</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200">Modifica los datos de la cita</p>
          </div>
        </div>
        <Button variant="outline" asChild className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
          <Link href={`/citas/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <Card className="mx-auto max-w-3xl border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Información de la cita</CardTitle>
            <CardDescription className="text-slate-200">
              Actualiza los detalles de la cita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Título *</Label>
                <Input
                  required
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                  value={form.titulo}
                  onChange={(e) => handleChange("titulo", e.target.value)}
                  placeholder="Título de la cita"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Descripción</Label>
                <Textarea
                  className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                  value={form.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Detalles adicionales"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => handleChange("tipo", v)}>
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REUNION">Reunión</SelectItem>
                      <SelectItem value="PRESENTACION">Presentación</SelectItem>
                      <SelectItem value="VISITA">Visita</SelectItem>
                      <SelectItem value="ENTREGA">Entrega</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Estado</Label>
                  <Select value={form.estado} onValueChange={(v) => handleChange("estado", v)}>
                    <SelectTrigger className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROGRAMADA">Programada</SelectItem>
                      <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                      <SelectItem value="COMPLETADA">Completada</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Fecha y hora de inicio *</Label>
                  <Input
                    required
                    type="datetime-local"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                    value={form.fechaInicio}
                    onChange={(e) => handleChange("fechaInicio", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Fecha y hora de fin *</Label>
                  <Input
                    required
                    type="datetime-local"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white"
                    value={form.fechaFin}
                    onChange={(e) => handleChange("fechaFin", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Ubicación</Label>
                  <Input
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.ubicacion}
                    onChange={(e) => handleChange("ubicacion", e.target.value)}
                    placeholder="Lugar de la reunión"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">URL de reunión virtual</Label>
                  <Input
                    type="url"
                    className="border-white/20 bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-300"
                    value={form.urlReunion}
                    onChange={(e) => handleChange("urlReunion", e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10"
                  type="button"
                >
                  <Link href={`/citas/${id}`}>Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
