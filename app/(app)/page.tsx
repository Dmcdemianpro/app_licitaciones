import Link from "next/link";
import { Plus, Ticket as TicketIcon } from "lucide-react";

import DashboardSummary from "@/components/dashboard-summary";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const summary = await getDashboardSummary({
    userId: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
  });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-4 backdrop-blur">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Sistema de Licitaciones</h1>
          <p className="text-sm text-slate-800 dark:text-slate-200">Resumen ejecutivo y accesos rapidos</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            asChild
            size="sm"
            variant="primary"
          >
            <Link href="/tickets">
              <TicketIcon className="mr-2 h-4 w-4" />
              Ver tickets
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="primary"
          >
            <Link href="/tickets/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo ticket
            </Link>
          </Button>
        </div>
      </header>

      <DashboardSummary initialSummary={summary} />
    </div>
  );
}
