/**
 * Formatea un monto en CLP al formato chileno
 * Ejemplo: 2085219938 -> "CLP $ 2.085.219.938"
 */
export function formatCLP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "No especificado";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "No especificado";
  }

  const formatted = new Intl.NumberFormat("es-CL", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);

  return `CLP $ ${formatted}`;
}

/**
 * Formatea un monto en millones (para tablas)
 * Ejemplo: 2085219938 -> "$2.085,2M"
 */
export function formatCLPMillones(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "-";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "-";
  }

  const millones = numAmount / 1000000;

  if (millones < 1) {
    const miles = numAmount / 1000;
    return `$${miles.toFixed(1)}K`;
  }

  const formatted = new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(millones);

  return `$${formatted}M`;
}

/**
 * Formatea un folio al formato HEC-XXX
 * Ejemplo: 1 -> "HEC-001", 42 -> "HEC-042"
 */
export function formatFolio(folio: number | null | undefined): string {
  if (folio === null || folio === undefined) {
    return "N/A";
  }
  return `HEC-${String(folio).padStart(3, "0")}`;
}

/**
 * Suma montos de un array de licitaciones
 */
export function sumarMontos(licitaciones: any[]): number {
  return licitaciones.reduce((acc, l) => {
    const monto = parseFloat(l.montoEstimado) || 0;
    return acc + monto;
  }, 0);
}
