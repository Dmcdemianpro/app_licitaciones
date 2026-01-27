import { TICKET_PRIORITY } from "@/lib/constants";

type SlaDefinition = {
  responseMinutes: number;
  resolutionMinutes: number;
};

export type SlaStatus = "ok" | "warning" | "breached" | "met" | "none";

export const SLA_DEFAULTS: Record<string, SlaDefinition> = {
  [TICKET_PRIORITY.ALTA]: { responseMinutes: 60, resolutionMinutes: 480 },
  [TICKET_PRIORITY.MEDIA]: { responseMinutes: 240, resolutionMinutes: 1440 },
  [TICKET_PRIORITY.BAJA]: { responseMinutes: 480, resolutionMinutes: 2880 },
};

export function getSlaDefinition(priority?: string | null): SlaDefinition {
  if (priority && SLA_DEFAULTS[priority]) {
    return SLA_DEFAULTS[priority];
  }
  return SLA_DEFAULTS[TICKET_PRIORITY.MEDIA];
}

export function buildSlaDates(priority: string, baseDate: Date = new Date()) {
  const { responseMinutes, resolutionMinutes } = getSlaDefinition(priority);
  return {
    responseMinutes,
    resolutionMinutes,
    responseDueAt: new Date(baseDate.getTime() + responseMinutes * 60_000),
    resolutionDueAt: new Date(baseDate.getTime() + resolutionMinutes * 60_000),
  };
}

export function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type SlaStatusInput = {
  createdAt?: string | Date | null;
  priority?: string | null;
  slaResponseMinutes?: number | null;
  slaResolutionMinutes?: number | null;
  slaResponseDueAt?: string | Date | null;
  slaResolutionDueAt?: string | Date | null;
  firstResponseAt?: string | Date | null;
  closedAt?: string | Date | null;
};

type SlaStatusResult = {
  responseStatus: SlaStatus;
  resolutionStatus: SlaStatus;
  overallStatus: SlaStatus;
  responseDueAt: Date | null;
  resolutionDueAt: Date | null;
  responseRemainingMinutes: number | null;
  resolutionRemainingMinutes: number | null;
};

type SlaCalcResult = {
  status: SlaStatus;
  remainingMinutes: number | null;
};

function calculateStatus(
  dueAt: Date | null,
  totalMinutes: number,
  completedAt: Date | null
): SlaCalcResult {
  if (!dueAt) {
    return { status: "none" as SlaStatus, remainingMinutes: null };
  }

  if (completedAt) {
    return {
      status: completedAt <= dueAt ? "met" : "breached",
      remainingMinutes: null,
    };
  }

  const now = new Date();
  const remaining = Math.ceil((dueAt.getTime() - now.getTime()) / 60_000);
  if (remaining <= 0) {
    return { status: "breached" as SlaStatus, remainingMinutes: 0 };
  }

  const warningThreshold = Math.max(1, Math.ceil(totalMinutes * 0.2));
  if (remaining <= warningThreshold) {
    return { status: "warning" as SlaStatus, remainingMinutes: remaining };
  }

  return { status: "ok" as SlaStatus, remainingMinutes: remaining };
}

export function getSlaStatus(input: SlaStatusInput): SlaStatusResult {
  const createdAt = parseDate(input.createdAt) ?? new Date();
  const { responseMinutes, resolutionMinutes } = getSlaDefinition(input.priority);
  const responseMinutesValue = input.slaResponseMinutes ?? responseMinutes;
  const resolutionMinutesValue = input.slaResolutionMinutes ?? resolutionMinutes;

  const responseDueAt =
    parseDate(input.slaResponseDueAt) ??
    new Date(createdAt.getTime() + responseMinutesValue * 60_000);
  const resolutionDueAt =
    parseDate(input.slaResolutionDueAt) ??
    new Date(createdAt.getTime() + resolutionMinutesValue * 60_000);

  const firstResponseAt = parseDate(input.firstResponseAt);
  const closedAt = parseDate(input.closedAt);

  const response: SlaCalcResult = calculateStatus(
    responseDueAt,
    responseMinutesValue,
    firstResponseAt
  );
  const resolution: SlaCalcResult = calculateStatus(
    resolutionDueAt,
    resolutionMinutesValue,
    closedAt
  );

  let overall: SlaStatus = "ok";
  if (closedAt) {
    overall = resolution.status;
  } else if (!firstResponseAt) {
    overall = response.status;
  } else {
    overall = resolution.status === "none" ? response.status : resolution.status;
  }

  if (response.status === "breached" || resolution.status === "breached") {
    overall = "breached";
  } else if (response.status === "warning" || resolution.status === "warning") {
    overall = "warning";
  }

  return {
    responseStatus: response.status,
    resolutionStatus: resolution.status,
    overallStatus: overall,
    responseDueAt,
    resolutionDueAt,
    responseRemainingMinutes: response.remainingMinutes,
    resolutionRemainingMinutes: resolution.remainingMinutes,
  };
}
