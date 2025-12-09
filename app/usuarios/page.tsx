import Link from "next/link";
import { Users, Shield, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function UsuariosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Administración</p>
            <h1 className="text-3xl font-bold text-white">Usuarios y roles</h1>
            <p className="text-sm text-slate-200">
              Administra accesos y permisos del sistema (módulo listo para conectar a backend).
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-white/5 via-white/0 to-white/0 p-6">
        <Card className="mx-auto max-w-4xl border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-200" />
              Gestión de usuarios
            </CardTitle>
            <CardDescription className="text-slate-200">
              Aquí verás el listado de usuarios, sus roles y estados. Añade la integración con tu API para poblarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
            <Shield className="h-10 w-10 text-indigo-300" />
            <p className="text-sm text-slate-200">
              Aún no hay usuarios cargados. Conecta tu backend o crea el primer usuario para verlos aquí.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                asChild
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:from-indigo-400 hover:to-purple-400"
              >
                <Link href="/login">
                  <Plus className="mr-2 h-4 w-4" />
                  Volver al acceso
                </Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:from-indigo-400 hover:to-purple-400"
              >
                <Link href="/usuarios/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear usuario
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
