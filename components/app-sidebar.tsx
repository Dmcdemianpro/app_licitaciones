"use client"

import { Calendar, FileText, Gavel, Home, Settings, Ticket, Users, Bell, BarChart3 } from "lucide-react"
import Link from "next/link"

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
    <Sidebar className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <SidebarHeader className="border-b border-white/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <FileText className="h-6 w-6 text-indigo-300" />
          <span className="font-semibold text-white">Sistema de Gestión</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-300">Módulos Principales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-200 hover:bg-white/10 hover:text-white transition"
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
          <SidebarGroupLabel className="text-slate-300">Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-200 hover:bg-white/10 hover:text-white transition"
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

      <SidebarFooter className="border-t">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Sistema Activo</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
