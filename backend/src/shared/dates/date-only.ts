import { AppError } from "../errors/app-error.js";

export function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(422, "VALIDATION_ERROR", "Data civil inválida.", [
      { field: "date", message: "Use uma data válida no formato YYYY-MM-DD." },
    ]);
  }
  return date;
}

export function formatDateOnly(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function todayInBusinessTimezone(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts();
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
