import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/sidebar.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Trazabilidad y Gestión de Licitaciones",
  description: "Sistema integral para gestión de tickets, licitaciones y procesos operativos",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    return (
      <html lang="es">
        <body
          className={`${inter.className} flex min-h-screen bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f172a_40%,_#0b1224_100%)] text-slate-100`}
        >
          <main className="flex flex-1 items-center justify-center p-6 backdrop-blur">
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body
        className={`${inter.className} flex min-h-screen bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f172a_40%,_#0b1224_100%)] text-slate-100`}
      >
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b border-white/10 bg-white/5 px-6 backdrop-blur">
              <span className="text-lg font-semibold text-white">Sistema de Licitaciones</span>
              {session ? (
                <span className="text-sm text-slate-200">
                  Hola, {session.user?.name ?? session.user?.email}
                </span>
              ) : (
                <a
                  href="/login"
                  className="rounded px-3 py-1 text-sm text-slate-100 underline hover:bg-white/10"
                >
                  Iniciar sesión
                </a>
              )}
            </header>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
