"use client"

import { Calendar, FileText, Gavel, Home, Settings, Ticket, Users, Bell, BarChart3, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Tickets",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Licitaciones",
    url: "/licitaciones",
    icon: Gavel,
  },
  {
    title: "Citas y Eventos",
    url: "/citas",
    icon: Calendar,
  },
  {
    title: "Notificaciones",
    url: "/notificaciones",
    icon: Bell,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
  },
]

const adminItems = [
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: Users,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <SidebarHeader className="border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
          <span className="font-semibold text-slate-900 dark:text-white">Sistema de Gestión</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-300">Módulos Principales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-white/10 hover:text-indigo-900 dark:hover:text-white transition"
                  >
                    <Link href={item.url} className="gap-3">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-300">Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-white/10 hover:text-indigo-900 dark:hover:text-white transition"
                  >
                    <Link href={item.url} className="gap-3">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 dark:border-white/10">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Sistema Activo</span>
          </div>
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={async () => {
              await signOut({ redirect: true, callbackUrl: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
