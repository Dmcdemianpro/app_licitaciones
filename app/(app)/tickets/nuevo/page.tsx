"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { ticketCreateSchema, type TicketCreateInput } from "@/lib/validations/tickets";

type FormData = TicketCreateInput;

const tipos = [
  { value: "Soporte técnico", label: "Soporte técnico" },
  { value: "Error de sistema", label: "Error de sistema" },
  { value: "Mejora", label: "Mejora" },
  { value: "Consulta", label: "Consulta" },
  { value: "Mantenimiento", label: "Mantenimiento" },
];
const prioridades = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];
const canales = [
  { value: "PORTAL", label: "Portal" },
  { value: "EMAIL", label: "Email" },
  { value: "CHAT", label: "Chat" },
  { value: "WHATSAPP", label: "WhatsApp" },
];
const responsables = [
  "Ivan Leiva",
  "Dario Perez",
  "Carlos Lopez",
  "Ana Martinez",
  "Luis Rodriguez",
];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar");
  return res.json();
};

export default function NuevoTicketPage() {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(ticketCreateSchema),
  });
  const { toast } = useToast();
  const router = useRouter();
  const { data: departamentosData } = useSWR(
    "/api/departamentos?incluirUnidades=true&incluirUsuarios=false&soloActivos=true",
    fetcher
  );
  const departamentos = departamentosData?.departamentos ?? [];
  const departamentoSeleccionadoId = watch("departamentoId");
  const departamentoSeleccionado = departamentos.find(
    (dep: any) => dep.id === departamentoSeleccionadoId
  );
  const unidades = departamentoSeleccionado?.unidades ?? [];

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      status: data.status ?? "CREADO",
      assignee: data.assignee?.trim() || null,
      departamentoId: data.departamentoId || null,
      unidadId: data.unidadId || null,
    };

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast({
        title: "Ticket creado",
        description: "El ticket ha sido creado exitosamente",
      });
      router.push("/tickets");
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear el ticket",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Ticket</h1>
          <p className="text-muted-foreground">
            Crear una nueva incidencia o solicitud
          </p>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Información del Ticket</CardTitle>
              <CardDescription>
                Completa los siguientes campos para crear un nuevo ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" placeholder="Título" {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Descripción"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tipos.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <p className="text-red-600 text-sm">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  {/* Prioridad */}
                  <div className="space-y-2">
                    <Label>Prioridad *</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            {prioridades.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.priority && (
                      <p className="text-red-600 text-sm">
                        {errors.priority.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Controller
                    name="canal"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {canales.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Controller
                      name="departamentoId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "none"}
                          onValueChange={(value) => {
                            const next = value === "none" ? "" : value;
                            field.onChange(next);
                            setValue("unidadId", "");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin departamento</SelectItem>
                            {departamentos.map((dep: any) => (
                              <SelectItem key={dep.id} value={dep.id}>
                                {dep.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Controller
                      name="unidadId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "none"}
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          disabled={!departamentoSeleccionado}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin unidad</SelectItem>
                            {unidades.map((unidad: any) => (
                              <SelectItem key={unidad.id} value={unidad.id}>
                                {unidad.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Responsable opcional */}
                <div className="space-y-2">
                  <Label>Asignar a</Label>
                  <Controller
                      name="assignee"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un responsable (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {responsables.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    Crear Ticket
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/tickets">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
