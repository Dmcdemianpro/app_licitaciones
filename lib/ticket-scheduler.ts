import { runSlaAlerts } from "@/lib/ticket-automation";

type SchedulerState = {
  started: boolean;
  timer: NodeJS.Timeout | null;
};

const DEFAULT_INTERVAL_MS = 60_000;

function getIntervalMs() {
  const raw = Number(process.env.TICKET_SCHEDULER_INTERVAL_MS);
  if (Number.isFinite(raw) && raw >= 10_000) {
    return raw;
  }
  return DEFAULT_INTERVAL_MS;
}

export function startTicketScheduler() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const state = (globalThis as { __ticketScheduler?: SchedulerState }).__ticketScheduler ?? {
    started: false,
    timer: null,
  };

  if (state.started) {
    return;
  }

  state.started = true;
  const intervalMs = getIntervalMs();

  const runCycle = async () => {
    try {
      await runSlaAlerts();
    } catch (error) {
      console.error("Error running SLA alerts:", error);
    }
  };

  setTimeout(runCycle, 5_000);
  state.timer = setInterval(runCycle, intervalMs);

  (globalThis as { __ticketScheduler?: SchedulerState }).__ticketScheduler = state;
}
