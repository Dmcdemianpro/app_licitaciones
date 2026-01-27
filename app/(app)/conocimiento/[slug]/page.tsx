"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Articulo = {
  id: string;
  titulo: string;
  resumen?: string | null;
  contenido: string;
  publicado: boolean;
  vistas: number;
  categoria?: {
    id: string;
    nombre: string;
  } | null;
};

export default function ArticuloDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticulo = async () => {
      try {
        const res = await fetch(`/api/conocimiento/articulos?slug=${slug}&incrementar=true`);
        if (!res.ok) {
          throw new Error("No se pudo cargar el articulo");
        }
        const data = await res.json();
        setArticulo(data.articulo);
      } catch (err) {
        setError("No se pudo cargar el articulo");
      } finally {
        setLoading(false);
      }
    };

    fetchArticulo();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Conocimiento
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Cargando articulo
            </h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-slate-600 dark:text-slate-300">
          Cargando...
        </div>
      </div>
    );
  }

  if (error || !articulo) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Conocimiento
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Articulo no encontrado
            </h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="max-w-md border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {error || "No se encontro el articulo solicitado"}
              </p>
              <Button asChild className="mt-4 w-full bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-700">
                <Link href="/conocimiento">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a conocimiento
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
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">
              Conocimiento
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              {articulo.titulo}
            </h1>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              {articulo.categoria?.nombre || "General"} • {articulo.vistas} vistas
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="border-white/30 text-slate-900 dark:text-white hover:bg-white/10">
          <Link href="/conocimiento">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </header>

      <div className="flex-1 p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  {articulo.titulo}
                </CardTitle>
                <Badge variant={articulo.publicado ? "default" : "secondary"}>
                  {articulo.publicado ? "Publicado" : "Borrador"}
                </Badge>
              </div>
              {articulo.resumen && (
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  {articulo.resumen}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                {articulo.contenido.split("\n").map((line, index) => (
                  <p key={`${articulo.id}-${index}`}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
