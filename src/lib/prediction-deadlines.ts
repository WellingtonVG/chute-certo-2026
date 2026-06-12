/** Prazos de palpite da Copa 2026 */

export const MATCH_TIMEZONE = "America/Sao_Paulo";

export const matchTodayHighlightClass =
  "border-green-500/60 bg-green-500/5 ring-1 ring-green-500/30";

const deadlineFormat: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
};

/** Palpites especiais: até 13/06/2026 20h (horário de Brasília) */
export const SEASON_PREDICTIONS_DEADLINE = new Date("2026-06-13T23:00:00.000Z");

export function formatDeadline(date: Date) {
  return date.toLocaleString("pt-BR", deadlineFormat);
}

export function formatMatchDateTime(isoDate: string) {
  const date = new Date(isoDate);
  const datePart = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: MATCH_TIMEZONE,
  });
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MATCH_TIMEZONE,
  });
  return `${datePart} · ${timePart}`;
}

export function isMatchToday(isoDate: string, now = new Date()) {
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: MATCH_TIMEZONE }).format(d);
  return dayKey(new Date(isoDate)) === dayKey(now);
}

export function isMatchPredictionOpen(matchDate: string, now = new Date()) {
  return new Date(matchDate) > now;
}

export function isSeasonPredictionOpen(now = new Date()) {
  return now < SEASON_PREDICTIONS_DEADLINE;
}

export function getSeasonPredictionsDeadlineLabel() {
  return formatDeadline(SEASON_PREDICTIONS_DEADLINE);
}
