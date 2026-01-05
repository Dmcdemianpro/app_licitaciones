"use client";

import Link from "next/link";
import { Users, Shield, Plus, UserCircle, Mail, Phone, Briefcase, Building2, Calendar, UserCheck, UserX, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

type User = {
  id: string
  email: string
  name: string | null
  role: string | null
  activo: boolean
  telefono: string | null
  departamento: string | null
  cargo: string | null
  createdAt: string
  isConnected: boolean
}

type Session = {
  user?: {
    id: string
    role?: string | null
  }
}

const roleLabels: Record<string, string> = {
  'USER': 'Usuario',
  'SUPERVISOR': 'Supervisor',
  'MANAGER': 'Manager',
  'ADMIN': 'Administrador'
}

const roleColors: Record<string, string> = {
  'USER': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'SUPERVISOR': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'MANAGER': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'ADMIN': 'bg-red-500/10 text-red-500 border-red-500/20'
}

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, sessionRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/auth/session')
      ]);

      const usersData = await usersRes.json();
      const sessionData = await sessionRes.json();

      setUsers(usersData.users || []);
      setSession(sessionData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      alert('Solo los administradores pueden eliminar usuarios');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuario eliminado exitosamente');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Administración</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Usuarios y roles</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              Administra accesos y permisos del sistema
            </p>
          </div>
        </div>
        <Button variant="default" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Crear Usuario
          </Link>
        </Button>
      </header>

      <div className="flex-1 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0 p-6">
        <div className="mx-auto w-full space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Usuarios</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Conectados</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {users.filter(u => u.isConnected).length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Activos</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {users.filter(u => u.activo).length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Inactivos</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {users.filter(u => !u.activo).length}
                    </p>
                  </div>
                  <UserX className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {users.length === 0 ? (
              <Card className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
                <CardContent className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 px-6 py-12 text-center">
                  <Shield className="h-12 w-12 text-indigo-500 dark:text-indigo-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No hay usuarios registrados</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Crea el primer usuario para comenzar
                    </p>
                  </div>
                  <Button variant="default" asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
                    <Link href="/usuarios/nuevo">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primer usuario
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          {user.isConnected && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {user.name || 'Sin nombre'}
                              </h3>
                              {user.isConnected && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  Conectado
                                </Badge>
                              )}
                              <Badge className={roleColors[user.role || 'USER']}>
                                {roleLabels[user.role || 'USER']}
                              </Badge>
                              {!user.activo && (
                                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                              <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>

                            {user.telefono && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <span>{user.telefono}</span>
                              </div>
                            )}

                            {user.cargo && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                                <Briefcase className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <span className="truncate">{user.cargo}</span>
                              </div>
                            )}

                            {user.departamento && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                                <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <span className="truncate">{user.departamento}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>Registrado el {new Date(user.createdAt).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild className="border-white/20 hover:bg-white/10">
                          <Link href={`/usuarios/${user.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.name || user.email)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
