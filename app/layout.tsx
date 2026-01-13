import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/sidebar.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import NextAuthSessionProvider from "@/components/providers/session-provider";

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
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${inter.className} flex min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f172a_40%,_#0b1224_100%)] text-slate-900 dark:text-slate-100`}
        >
          <NextAuthSessionProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <main className="flex flex-1 items-center justify-center p-6 backdrop-blur">
                {children}
              </main>
              <Toaster />
            </ThemeProvider>
          </NextAuthSessionProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.className} flex min-h-screen bg-white dark:bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f172a_40%,_#0b1224_100%)] text-slate-900 dark:text-slate-100`}
      >
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-6">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Sistema de Licitaciones</span>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {session ? (
                      <span className="text-sm text-slate-800 dark:text-slate-200">
                        Hola, {session.user?.name ?? session.user?.email}
                      </span>
                    ) : (
                      <a
                        href="/login"
                        className="rounded px-3 py-1 text-sm text-slate-900 dark:text-slate-100 underline hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        Iniciar sesión
                      </a>
                    )}
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-transparent">{children}</main>
              </div>
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
