"use client";
import { useRouter } from "next/navigation";
import { default as useSWR } from "swr";
import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TicketEdit({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { data, isLoading } = useSWR(`/api/tickets/${resolvedParams.id}`, fetcher);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setDescription(data.description);
    }
  }, [data]);
  if (isLoading) return <p>Cargando…</p>;

  const handleSave = async () => {
    await fetch(`/api/tickets/${resolvedParams.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    router.push("/tickets");
  };
  const handleDelete = async () => {
    await fetch(`/api/tickets/${resolvedParams.id}`, { method: "DELETE" });
    router.push("/tickets");
  };

  return (
    <div className="space-y-4 max-w-lg">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={handleSave}>Guardar</Button>
        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
      </div>
    </div>
  );
}