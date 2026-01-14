import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import NextAuthSessionProvider from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Iniciar Sesión - Sistema de Licitaciones",
  description: "Acceso al sistema de gestión de licitaciones",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
