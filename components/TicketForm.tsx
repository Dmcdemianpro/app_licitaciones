"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ticketCreateSchema, ticketUpdateSchema, type TicketCreateInput } from "@/lib/validations/tickets";

type FormData = TicketCreateInput;

type Props = {
  defaultValues?: Partial<FormData>;
  ticketId?: string;
};

const priorities = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

export default function TicketForm({ defaultValues, ticketId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(ticketId ? ticketUpdateSchema : ticketCreateSchema),
    defaultValues: {
      priority: "MEDIA",
      status: "ABIERTO",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const res = await fetch(ticketId ? `/api/tickets/${ticketId}` : "/api/tickets", {
      method: ticketId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(ticketId ? "Ticket actualizado" : "Ticket creado");
      router.push("/tickets");
      router.refresh();
    } else {
      toast.error("Error al guardar");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("title")}
        placeholder="Título"
        className="w-full rounded border p-2"
      />
      {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}

      <textarea
        {...register("description")}
        placeholder="Descripción"
        className="h-24 w-full rounded border p-2"
      />
      {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}

      <input
        {...register("type")}
        placeholder="Tipo (soporte, mejora, etc.)"
        className="w-full rounded border p-2"
      />
      {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}

      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <select {...field} className="w-full rounded border p-2">
            {priorities.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />
      {errors.priority && <p className="text-sm text-red-600">{errors.priority.message}</p>}

      <input
        {...register("assignee")}
        placeholder="Responsable (opcional)"
        className="w-full rounded border p-2"
      />
      {errors.assignee && <p className="text-sm text-red-600">{errors.assignee.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting || loading}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {ticketId ? "Actualizar" : "Crear"}
      </button>
    </form>
  );
}
